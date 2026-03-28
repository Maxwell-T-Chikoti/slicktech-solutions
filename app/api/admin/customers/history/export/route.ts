import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '../../../audit/_shared';

const DEFAULT_LIMIT = 20000;
const MAX_LIMIT = 50000;

type BookingRow = {
  id: number;
  user_id: string | null;
  service: string | null;
  date: string | null;
  time: string | null;
  status: string | null;
  price: string | null;
  location: string | null;
  created_at: string | null;
  assigned_staff_id: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  first_name: string | null;
  surname: string | null;
  phone: string | null;
  location: string | null;
};

type ArchiveRow = {
  booking_id: number;
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_location: string | null;
  assigned_staff_name: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const { supabaseAdmin } = context;
    const { searchParams } = new URL(req.url);
    const customerId = String(searchParams.get('customerId') || '').trim();
    const customerEmail = String(searchParams.get('customerEmail') || searchParams.get('email') || '').trim().toLowerCase();
    const limitParam = Number(searchParams.get('limit') || DEFAULT_LIMIT);
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(limitParam)))
      : DEFAULT_LIMIT;

    const { data: bookingsData, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, user_id, service, date, time, status, price, location, created_at, assigned_staff_id')
      .order('id', { ascending: false })
      .limit(limit);

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message || 'Failed to load bookings.' }, { status: 500 });
    }

    const bookings = (bookingsData || []) as BookingRow[];
    const allProfileIds = Array.from(
      new Set(
        bookings
          .flatMap((row) => [row.user_id, row.assigned_staff_id])
          .filter((id): id is string => !!id)
      )
    );

    let profiles: ProfileRow[] = [];
    if (allProfileIds.length > 0) {
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('id, email, first_name, surname, phone, location')
        .in('id', allProfileIds);

      profiles = (profileData || []) as ProfileRow[];
    }

    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

    const bookingIds = bookings.map((row) => row.id);
    let existingArchiveRows: ArchiveRow[] = [];
    if (bookingIds.length > 0) {
      const { data: existingData } = await supabaseAdmin
        .from('customer_history_archive')
        .select('booking_id, customer_email, customer_name, customer_phone, customer_location, assigned_staff_name')
        .in('booking_id', bookingIds);

      existingArchiveRows = (existingData || []) as ArchiveRow[];
    }

    const existingByBookingId = new Map(existingArchiveRows.map((row) => [row.booking_id, row]));

    const archivePayload = bookings.map((booking) => {
      const customerProfile = booking.user_id ? profileById.get(booking.user_id) : null;
      const staffProfile = booking.assigned_staff_id ? profileById.get(booking.assigned_staff_id) : null;
      const existing = existingByBookingId.get(booking.id);

      const customerName = `${customerProfile?.first_name || ''} ${customerProfile?.surname || ''}`.trim() || existing?.customer_name || 'Deleted Customer';
      const assignedStaffName = `${staffProfile?.first_name || ''} ${staffProfile?.surname || ''}`.trim() || existing?.assigned_staff_name || 'Unassigned';

      return {
        booking_id: booking.id,
        customer_id: booking.user_id,
        customer_email: customerProfile?.email || existing?.customer_email || `deleted-user-${booking.user_id || 'unknown'}@archived.local`,
        customer_name: customerName,
        customer_phone: customerProfile?.phone || existing?.customer_phone || null,
        customer_location: customerProfile?.location || booking.location || existing?.customer_location || null,
        service: booking.service || 'N/A',
        booking_date: booking.date,
        booking_time: booking.time,
        status: booking.status,
        price: booking.price,
        assigned_staff_id: booking.assigned_staff_id,
        assigned_staff_name: assignedStaffName,
        booking_created_at: booking.created_at,
        archived_at: new Date().toISOString(),
      };
    });

    if (archivePayload.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('customer_history_archive')
        .upsert(archivePayload, { onConflict: 'booking_id' });

      if (upsertError) {
        return NextResponse.json(
          {
            error: upsertError.message || 'Failed to persist customer archive records.',
            hint: 'Ensure customer_history_archive table exists (run customer history archive migration).',
          },
          { status: 500 }
        );
      }
    }

    let historyQuery = supabaseAdmin
      .from('customer_history_archive')
      .select('booking_id, customer_id, customer_email, customer_name, customer_phone, customer_location, service, booking_date, booking_time, status, price, assigned_staff_id, assigned_staff_name, booking_created_at, archived_at')
      .order('booking_date', { ascending: false })
      .order('booking_id', { ascending: false })
      .limit(limit);

    if (customerId && customerEmail) {
      historyQuery = historyQuery.or(`customer_id.eq.${customerId},customer_email.eq.${customerEmail}`);
    } else if (customerId) {
      historyQuery = historyQuery.eq('customer_id', customerId);
    } else {
      historyQuery = historyQuery.eq('customer_email', customerEmail);
    }

    const { data: historyRows, error: historyError } = await historyQuery;

    if (historyError) {
      return NextResponse.json({ error: historyError.message || 'Failed to load archived customer history.' }, { status: 500 });
    }

    const history = (historyRows || []).map((row: any) => ({
      booking_id: row.booking_id,
      customer_id: row.customer_id,
      customer_email: row.customer_email,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      customer_location: row.customer_location,
      service: row.service,
      date: row.booking_date,
      time: row.booking_time,
      status: row.status,
      price: row.price,
      assigned_staff_id: row.assigned_staff_id,
      assigned_staff_name: row.assigned_staff_name,
      booking_created_at: row.booking_created_at,
      archived_at: row.archived_at,
    }));

    const head = history[0] || {};
    const isAllCustomersExport = !customerId && !customerEmail;
    return NextResponse.json({
      customer: {
        customer_id: isAllCustomersExport ? null : head.customer_id || customerId || null,
        customer_email: isAllCustomersExport ? null : head.customer_email || customerEmail || null,
        customer_name: isAllCustomersExport ? 'All Customers' : head.customer_name || 'Customer',
        customer_phone: isAllCustomersExport ? null : head.customer_phone || null,
        customer_location: isAllCustomersExport ? null : head.customer_location || null,
      },
      history,
      archivedCount: history.length,
      scope: isAllCustomersExport ? 'all-customers' : 'single-customer',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to export customer history archive.',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
