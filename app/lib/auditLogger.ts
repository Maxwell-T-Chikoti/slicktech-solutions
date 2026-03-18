import { createClient } from '@supabase/supabase-js';

type AuditLogInput = {
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  category?: string;
  source?: string;
  targetType?: string | null;
  targetId?: string | number | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
};

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const getRequestIp = (request: Request) => {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return request.headers.get('x-real-ip') || null;
};

export const writeAuditLog = async (entry: AuditLogInput) => {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return;
  }

  try {
    await supabaseAdmin.from('audit_logs').insert([
      {
        actor_user_id: entry.actorUserId || null,
        actor_email: entry.actorEmail || null,
        actor_role: entry.actorRole || null,
        action: entry.action,
        category: entry.category || 'general',
        source: entry.source || 'web',
        target_type: entry.targetType || null,
        target_id: entry.targetId != null ? String(entry.targetId) : null,
        ip_address: entry.ipAddress || null,
        metadata: entry.metadata || {},
      },
    ]);
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
