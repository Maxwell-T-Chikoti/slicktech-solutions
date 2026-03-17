import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type StaffActionBody = {
  staffId?: string;
  action?: 'disable' | 'enable' | 'reset-password';
  newPassword?: string;
};

const LONG_BAN_DURATION = '876000h'; // ~100 years

const getAdminContext = async (req: NextRequest) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { error: NextResponse.json({ error: 'Server is missing Supabase configuration.' }, { status: 500 }) };
  }

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return { error: NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 }) };
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: requesterAuth, error: requesterAuthError } = await supabaseAdmin.auth.getUser(token);
  if (requesterAuthError || !requesterAuth?.user) {
    return { error: NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 }) };
  }

  const { data: requesterProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', requesterAuth.user.id)
    .single();

  if (!requesterProfile || requesterProfile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Only admins can manage staff accounts.' }, { status: 403 }) };
  }

  return { supabaseAdmin };
};

export async function GET(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const { supabaseAdmin } = context;

    const [{ data: profiles, error: profilesError }, { data: authUsersData, error: authUsersError }] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('id, first_name, surname, email, phone, location, role')
        .order('first_name', { ascending: true }),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message || 'Failed to fetch staff profiles.' }, { status: 500 });
    }

    if (authUsersError) {
      return NextResponse.json({ error: authUsersError.message || 'Failed to fetch staff auth records.' }, { status: 500 });
    }

    const users = authUsersData?.users || [];
    const authMap = new Map(users.map((u) => [u.id, u]));

    const isStaffRole = (role: unknown) => String(role || '').trim().toLowerCase() === 'staff';

    const profileStaff = (profiles || []).filter((profile: any) => isStaffRole(profile.role));
    const profileStaffMap = new Map(profileStaff.map((profile: any) => [profile.id, profile]));

    // Include auth users tagged as staff even if profile role data is inconsistent in production.
    users.forEach((user: any) => {
      const metadataRole = user?.user_metadata?.role || user?.app_metadata?.role;
      if (isStaffRole(metadataRole) && !profileStaffMap.has(user.id)) {
        profileStaffMap.set(user.id, {
          id: user.id,
          first_name: user?.user_metadata?.first_name || 'Staff',
          surname: user?.user_metadata?.surname || 'Member',
          email: user?.email || '',
          phone: user?.user_metadata?.phone || '',
          location: user?.user_metadata?.location || '',
          role: 'staff',
        });
      }
    });

    const staff = Array.from(profileStaffMap.values())
      .map((profile: any) => {
        const authUser: any = authMap.get(profile.id);
        const bannedUntil = authUser?.banned_until || null;
        const isDisabled = bannedUntil ? new Date(bannedUntil).getTime() > Date.now() : false;

        return {
          ...profile,
          isDisabled,
          bannedUntil,
        };
      })
      .sort((a: any, b: any) => `${a.first_name} ${a.surname}`.localeCompare(`${b.first_name} ${b.surname}`));

    return NextResponse.json({ staff });
  } catch (error: any) {
    console.error('Staff management GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff list.', details: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const { supabaseAdmin } = context;
    const body = (await req.json()) as StaffActionBody;
    const staffId = (body.staffId || '').trim();
    const action = body.action;

    if (!staffId || !action) {
      return NextResponse.json({ error: 'staffId and action are required.' }, { status: 400 });
    }

    if (action === 'reset-password') {
      const newPassword = (body.newPassword || '').trim();
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters long.' }, { status: 400 });
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(staffId, {
        password: newPassword,
      });

      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to reset staff password.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action });
    }

    if (action === 'disable') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(staffId, {
        ban_duration: LONG_BAN_DURATION,
      });

      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to disable staff account.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action });
    }

    if (action === 'enable') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(staffId, {
        ban_duration: 'none',
      });

      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to enable staff account.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, action });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error: any) {
    console.error('Staff management PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update staff account.', details: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const { supabaseAdmin } = context;
    const { searchParams } = new URL(req.url);
    const staffId = (searchParams.get('staffId') || '').trim();

    if (!staffId) {
      return NextResponse.json({ error: 'staffId is required.' }, { status: 400 });
    }

    await supabaseAdmin
      .from('bookings')
      .update({ assigned_staff_id: null })
      .eq('assigned_staff_id', staffId);

    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', staffId)
      .eq('role', 'staff');

    if (profileDeleteError) {
      return NextResponse.json({ error: profileDeleteError.message || 'Failed to remove staff profile.' }, { status: 500 });
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(staffId);
    if (authDeleteError) {
      return NextResponse.json({ error: authDeleteError.message || 'Failed to delete staff auth account.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Staff management DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete staff account.', details: error?.message || 'Unknown error' }, { status: 500 });
  }
}
