import { NextRequest, NextResponse } from 'next/server';
import { getRequestIp } from '@/app/lib/auditLogger';
import { getAdminContext } from '../_shared';

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 2000;

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
    const category = (searchParams.get('category') || '').trim();
    const q = (searchParams.get('q') || '').trim();

    let query = supabaseAdmin
      .from('audit_logs')
      .select('id, created_at, actor_user_id, actor_email, actor_role, action, category, source, target_type, target_id, ip_address, metadata')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    if (q) {
      query = query.ilike('action', `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to fetch audit logs.' }, { status: 500 });
    }

    return NextResponse.json({ logs: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch audit logs.', details: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const { supabaseAdmin, requester } = context;
    const body = await req.json();

    const action = String(body?.action || '').trim();
    const category = String(body?.category || 'admin-action').trim();
    const source = String(body?.source || 'admin-dashboard').trim();
    const targetType = body?.targetType ? String(body.targetType).trim() : null;
    const targetId = body?.targetId != null ? String(body.targetId) : null;
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    if (!action) {
      return NextResponse.json({ error: 'Action is required.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .insert([
        {
          actor_user_id: requester.id,
          actor_email: requester.email,
          actor_role: requester.role,
          action,
          category,
          source,
          target_type: targetType,
          target_id: targetId,
          ip_address: getRequestIp(req),
          metadata,
        },
      ])
      .select('id, created_at, actor_user_id, actor_email, actor_role, action, category, source, target_type, target_id, ip_address, metadata')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to save audit log.' }, { status: 500 });
    }

    return NextResponse.json({ log: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to save audit log.', details: error?.message || 'Unknown error' }, { status: 500 });
  }
}
