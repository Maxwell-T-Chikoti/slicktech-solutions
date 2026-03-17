import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type CreateStaffBody = {
  firstName?: string;
  surname?: string;
  email?: string;
  password?: string;
  phone?: string;
  location?: string;
};

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server is missing Supabase configuration.' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      return NextResponse.json({ error: 'Missing authorization token.' }, { status: 401 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: requesterAuth, error: requesterAuthError } = await supabaseAdmin.auth.getUser(token);
    if (requesterAuthError || !requesterAuth?.user) {
      return NextResponse.json({ error: 'Invalid authentication token.' }, { status: 401 });
    }

    const { data: requesterProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requesterAuth.user.id)
      .single();

    if (!requesterProfile || requesterProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create staff accounts.' }, { status: 403 });
    }

    const body = (await req.json()) as CreateStaffBody;
    const firstName = (body.firstName || '').trim();
    const surname = (body.surname || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const phone = (body.phone || '').trim();
    const location = (body.location || '').trim();

    if (!firstName || !surname || !email || !password) {
      return NextResponse.json({ error: 'firstName, surname, email, and password are required.' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    const { data: createdAuth, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        surname,
        phone,
        location,
        role: 'staff',
      },
      app_metadata: {
        role: 'staff',
      },
    });

    if (createAuthError || !createdAuth?.user) {
      return NextResponse.json({ error: createAuthError?.message || 'Failed to create staff auth user.' }, { status: 400 });
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: createdAuth.user.id,
        first_name: firstName,
        surname,
        email,
        phone,
        location,
        role: 'staff',
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
      return NextResponse.json({ error: profileError.message || 'Failed to create staff profile.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, staffId: createdAuth.user.id, email });
  } catch (error: any) {
    console.error('Create staff API error:', error);
    return NextResponse.json(
      { error: 'Failed to create staff user.', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
