import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext, toCsv } from '../_shared';

const DEFAULT_LIMIT = 5000;
const MAX_LIMIT = 20000;

export async function GET(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const { supabaseAdmin } = context;
    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get('limit') || DEFAULT_LIMIT);
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(limitParam)))
      : DEFAULT_LIMIT;

    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('id, created_at, actor_user_id, actor_email, actor_role, category, source, target_type, target_id, ip_address, action, metadata')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to export audit logs.' }, { status: 500 });
    }

    const csv = toCsv((data || []) as Array<Record<string, unknown>>);
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-logs-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to export audit logs.', details: error?.message || 'Unknown error' }, { status: 500 });
  }
}
