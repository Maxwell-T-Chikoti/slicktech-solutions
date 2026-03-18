import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const getAdminContext = async (req: NextRequest) => {
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
    .select('id, role, email, first_name, surname')
    .eq('id', requesterAuth.user.id)
    .single();

  if (!requesterProfile || requesterProfile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Only admins can access audit logs.' }, { status: 403 }) };
  }

  return {
    supabaseAdmin,
    requester: {
      id: requesterAuth.user.id,
      email: requesterAuth.user.email || requesterProfile.email || null,
      role: requesterProfile.role,
      firstName: requesterProfile.first_name || null,
      surname: requesterProfile.surname || null,
    },
  };
};

export const toCsv = (rows: Array<Record<string, unknown>>) => {
  if (!rows.length) {
    return 'id,created_at,actor_user_id,actor_email,actor_role,category,source,target_type,target_id,ip_address,action,metadata\n';
  }

  const headers = [
    'id',
    'created_at',
    'actor_user_id',
    'actor_email',
    'actor_role',
    'category',
    'source',
    'target_type',
    'target_id',
    'ip_address',
    'action',
    'metadata',
  ];

  const escapeCell = (value: unknown) => {
    const normalized = value == null ? '' : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
  };

  const lines = rows.map((row) =>
    headers
      .map((header) => {
        const value = header === 'metadata' ? JSON.stringify(row[header] || {}) : row[header];
        return escapeCell(value);
      })
      .join(',')
  );

  return `${headers.join(',')}\n${lines.join('\n')}\n`;
};
