import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type PromoCreateBody = {
  code?: string;
  percentageOff?: number;
};

type PromoUpdateBody = {
  id?: number;
  isActive?: boolean;
};

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
    return { error: NextResponse.json({ error: 'Only admins can manage promo codes.' }, { status: 403 }) };
  }

  return { supabaseAdmin };
};

const normalizeCode = (raw: string) => raw.trim().toUpperCase();

export async function GET(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const { supabaseAdmin } = context;
    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .select('id, code, percentage_off, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to fetch promo codes.' }, { status: 500 });
    }

    return NextResponse.json({ promoCodes: data || [] });
  } catch (error: any) {
    console.error('Promo codes GET error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch promo codes.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const body = (await req.json()) as PromoCreateBody;
    const code = normalizeCode(String(body.code || ''));
    const percentageOff = Number(body.percentageOff);

    if (!code || !/^[A-Z0-9_-]{3,20}$/.test(code)) {
      return NextResponse.json(
        { error: 'Promo code must be 3-20 characters and use only letters, numbers, underscore, or hyphen.' },
        { status: 400 }
      );
    }

    if (Number.isNaN(percentageOff) || percentageOff <= 0 || percentageOff > 100) {
      return NextResponse.json({ error: 'percentageOff must be a number between 0 and 100.' }, { status: 400 });
    }

    const { supabaseAdmin } = context;
    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .insert([{ code, percentage_off: percentageOff, is_active: true }])
      .select('id, code, percentage_off, is_active, created_at, updated_at')
      .single();

    if (error) {
      const duplicate = String(error.message || '').toLowerCase().includes('duplicate');
      return NextResponse.json(
        { error: duplicate ? 'This promo code already exists.' : error.message || 'Failed to create promo code.' },
        { status: duplicate ? 409 : 500 }
      );
    }

    return NextResponse.json({ promoCode: data });
  } catch (error: any) {
    console.error('Promo codes POST error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create promo code.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const body = (await req.json()) as PromoUpdateBody;
    const id = Number(body.id);
    const isActive = Boolean(body.isActive);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'A valid promo code id is required.' }, { status: 400 });
    }

    const { supabaseAdmin } = context;
    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('id, code, percentage_off, is_active, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to update promo code.' }, { status: 500 });
    }

    return NextResponse.json({ promoCode: data });
  } catch (error: any) {
    console.error('Promo codes PATCH error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update promo code.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const id = Number((new URL(req.url).searchParams.get('id') || '').trim());
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'A valid promo code id is required.' }, { status: 400 });
    }

    const { supabaseAdmin } = context;
    const { error } = await supabaseAdmin
      .from('promo_codes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to delete promo code.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Promo codes DELETE error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete promo code.' }, { status: 500 });
  }
}
