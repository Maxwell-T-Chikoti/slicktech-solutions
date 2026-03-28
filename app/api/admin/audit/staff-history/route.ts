import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '../_shared';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 5000;

type StaffDirectoryRow = {
  staff_user_id: string;
  first_name: string | null;
  surname: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
  last_seen_at: string;
  is_active: boolean;
  archived_at: string | null;
};

type StaffCounterRow = {
  staff_user_id: string;
  total_assignments: number;
  total_unassignments: number;
  completed_jobs: number;
  last_completed_at: string | null;
  updated_at: string;
};

export async function GET(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const { supabaseAdmin } = context;
    const { searchParams } = new URL(req.url);

    const staffId = (searchParams.get('staffId') || '').trim();
    const eventType = (searchParams.get('eventType') || '').trim();
    const limitParam = Number(searchParams.get('limit') || DEFAULT_LIMIT);
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(limitParam)))
      : DEFAULT_LIMIT;

    let staffQuery = supabaseAdmin
      .from('staff_directory')
      .select('staff_user_id, first_name, surname, email, phone, location, created_at, last_seen_at, is_active, archived_at')
      .order('first_name', { ascending: true });

    if (staffId) {
      staffQuery = staffQuery.eq('staff_user_id', staffId);
    }

    let countersQuery = supabaseAdmin
      .from('staff_job_counters')
      .select('staff_user_id, total_assignments, total_unassignments, completed_jobs, last_completed_at, updated_at');

    if (staffId) {
      countersQuery = countersQuery.eq('staff_user_id', staffId);
    }

    let eventsQuery = supabaseAdmin
      .from('staff_job_audit')
      .select(
        'id, created_at, booking_id, event_type, staff_user_id, previous_staff_user_id, completed_at, booking_status, staff_first_name, staff_surname, staff_email, staff_phone, staff_location, booking_snapshot, metadata'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (staffId) {
      eventsQuery = eventsQuery.eq('staff_user_id', staffId);
    }

    if (eventType) {
      eventsQuery = eventsQuery.eq('event_type', eventType);
    }

    const [{ data: staffRows, error: staffError }, { data: counterRows, error: counterError }, { data: eventRows, error: eventError }] =
      await Promise.all([staffQuery, countersQuery, eventsQuery]);

    if (staffError) {
      return NextResponse.json({ error: staffError.message || 'Failed to fetch staff directory.' }, { status: 500 });
    }

    if (counterError) {
      return NextResponse.json({ error: counterError.message || 'Failed to fetch staff counters.' }, { status: 500 });
    }

    if (eventError) {
      return NextResponse.json({ error: eventError.message || 'Failed to fetch staff audit events.' }, { status: 500 });
    }

    const counterMap = new Map((counterRows || []).map((row: StaffCounterRow) => [row.staff_user_id, row]));

    const staffSummary = (staffRows || []).map((row: StaffDirectoryRow) => {
      const stats = counterMap.get(row.staff_user_id);
      return {
        ...row,
        total_assignments: stats?.total_assignments || 0,
        total_unassignments: stats?.total_unassignments || 0,
        completed_jobs: stats?.completed_jobs || 0,
        last_completed_at: stats?.last_completed_at || null,
        counters_updated_at: stats?.updated_at || null,
      };
    });

    return NextResponse.json({
      staff: staffSummary,
      events: eventRows || [],
      filters: {
        staffId: staffId || null,
        eventType: eventType || null,
        limit,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch staff history audit trail.', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
