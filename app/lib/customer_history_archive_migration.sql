-- Durable customer booking history archive.
-- Keeps immutable booking/customer snapshots for retention, including when customer profiles are later deleted.

create table if not exists public.customer_history_archive (
  id bigserial primary key,
  booking_id bigint not null unique,
  customer_id uuid null,
  customer_email text not null,
  customer_name text null,
  customer_phone text null,
  customer_location text null,
  service text not null,
  booking_date text null,
  booking_time text null,
  status text null,
  price text null,
  assigned_staff_id uuid null,
  assigned_staff_name text null,
  booking_created_at timestamptz null,
  archived_at timestamptz not null default now()
);

create index if not exists idx_customer_history_archive_customer_id
  on public.customer_history_archive(customer_id);

create index if not exists idx_customer_history_archive_customer_email
  on public.customer_history_archive(customer_email);

create index if not exists idx_customer_history_archive_booking_date
  on public.customer_history_archive(booking_date desc);

-- Optional hardening: prevent accidental updates to immutable snapshots by non-service roles.
-- You can keep RLS enabled and lock this table down to service-role access via admin API routes.
alter table public.customer_history_archive enable row level security;

-- Keep archive in sync automatically whenever bookings are inserted or updated.
create or replace function public.sync_customer_history_archive_from_booking()
returns trigger
language plpgsql
security definer
as $$
declare
  v_customer_email text;
  v_customer_name text;
  v_customer_phone text;
  v_customer_location text;
  v_staff_name text;
begin
  select p.email, concat_ws(' ', p.first_name, p.surname), p.phone, p.location
    into v_customer_email, v_customer_name, v_customer_phone, v_customer_location
  from public.profiles p
  where p.id = new.user_id;

  if new.assigned_staff_id is not null then
    select concat_ws(' ', p.first_name, p.surname)
      into v_staff_name
    from public.profiles p
    where p.id = new.assigned_staff_id;
  end if;

  insert into public.customer_history_archive (
    booking_id,
    customer_id,
    customer_email,
    customer_name,
    customer_phone,
    customer_location,
    service,
    booking_date,
    booking_time,
    status,
    price,
    assigned_staff_id,
    assigned_staff_name,
    booking_created_at,
    archived_at
  ) values (
    new.id,
    new.user_id,
    coalesce(v_customer_email, format('deleted-user-%s@archived.local', coalesce(new.user_id::text, 'unknown'))),
    coalesce(v_customer_name, 'Deleted Customer'),
    v_customer_phone,
    coalesce(v_customer_location, new.location),
    coalesce(new.service, 'N/A'),
    new.date,
    new.time,
    new.status,
    new.price,
    new.assigned_staff_id,
    coalesce(v_staff_name, 'Unassigned'),
    new.created_at,
    now()
  )
  on conflict (booking_id)
  do update set
    customer_id = excluded.customer_id,
    customer_email = coalesce(excluded.customer_email, public.customer_history_archive.customer_email),
    customer_name = coalesce(excluded.customer_name, public.customer_history_archive.customer_name),
    customer_phone = coalesce(excluded.customer_phone, public.customer_history_archive.customer_phone),
    customer_location = coalesce(excluded.customer_location, public.customer_history_archive.customer_location),
    service = excluded.service,
    booking_date = excluded.booking_date,
    booking_time = excluded.booking_time,
    status = excluded.status,
    price = excluded.price,
    assigned_staff_id = excluded.assigned_staff_id,
    assigned_staff_name = coalesce(excluded.assigned_staff_name, public.customer_history_archive.assigned_staff_name),
    booking_created_at = coalesce(excluded.booking_created_at, public.customer_history_archive.booking_created_at),
    archived_at = now();

  return new;
end;
$$;

drop trigger if exists trg_sync_customer_history_archive_from_booking on public.bookings;
create trigger trg_sync_customer_history_archive_from_booking
after insert or update on public.bookings
for each row
execute function public.sync_customer_history_archive_from_booking();

-- On profile deletion, preserve user identity details for related booking history snapshots.
create or replace function public.preserve_customer_history_on_profile_delete()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.customer_history_archive
  set
    customer_email = coalesce(customer_email, old.email, format('deleted-user-%s@archived.local', old.id::text)),
    customer_name = coalesce(customer_name, concat_ws(' ', old.first_name, old.surname), 'Deleted Customer'),
    customer_phone = coalesce(customer_phone, old.phone),
    customer_location = coalesce(customer_location, old.location),
    archived_at = now()
  where customer_id = old.id;

  return old;
end;
$$;

drop trigger if exists trg_preserve_customer_history_on_profile_delete on public.profiles;
create trigger trg_preserve_customer_history_on_profile_delete
before delete on public.profiles
for each row
execute function public.preserve_customer_history_on_profile_delete();
