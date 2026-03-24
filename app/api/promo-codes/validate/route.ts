import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export async function GET(req: NextRequest) {
  try {
    const code = (new URL(req.url).searchParams.get('code') || '').trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Promo code is required.' }, { status: 400 });
    }

    const supabaseAdmin = getServiceClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ valid: false, error: 'Server configuration is incomplete.' }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('promo_codes')
      .select('code, percentage_off')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ valid: false, error: error.message || 'Failed to validate promo code.' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ valid: false, error: 'Promo code is invalid or inactive.' }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      code: data.code,
      percentageOff: Number(data.percentage_off),
    });
  } catch (error: any) {
    console.error('Promo validation error:', error);
    return NextResponse.json(
      { valid: false, error: error?.message || 'Unexpected error while validating promo code.' },
      { status: 500 }
    );
  }
}
