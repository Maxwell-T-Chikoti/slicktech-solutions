import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'chat-attachments';
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

const getAuthContext = async (req: NextRequest, bookingId: number) => {
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

  const requesterId = requesterAuth.user.id;

  const { data: requesterProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', requesterId)
    .single();

  if (!requesterProfile || !['admin', 'staff'].includes(requesterProfile.role)) {
    return { error: NextResponse.json({ error: 'Only staff and admins can upload chat attachments.' }, { status: 403 }) };
  }

  if (requesterProfile.role === 'staff') {
    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, assigned_staff_id')
      .eq('id', bookingId)
      .single();

    if (!booking || booking.assigned_staff_id !== requesterId) {
      return { error: NextResponse.json({ error: 'You can only upload files for bookings assigned to you.' }, { status: 403 }) };
    }
  }

  return { supabaseAdmin, requesterId };
};

const ensureBucket = async (supabaseAdmin: any) => {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    throw new Error(listError.message || 'Unable to list storage buckets.');
  }

  const exists = Array.isArray(buckets) && buckets.some((bucket) => bucket.id === BUCKET_NAME || bucket.name === BUCKET_NAME);
  if (exists) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`,
  });

  if (createError && !String(createError.message || '').toLowerCase().includes('already')) {
    throw new Error(createError.message || 'Could not create chat attachments bucket.');
  }
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const bookingIdRaw = formData.get('booking_id');
    const file = formData.get('file');

    const bookingId = Number(bookingIdRaw);
    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return NextResponse.json({ error: 'Valid booking_id is required.' }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Attachment file is required.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File is too large. Maximum allowed size is 15MB.' }, { status: 400 });
    }

    const context = await getAuthContext(req, bookingId);
    if ('error' in context) return context.error;

    const { supabaseAdmin, requesterId } = context;

    await ensureBucket(supabaseAdmin as any);

    const originalName = file.name || 'attachment.bin';
    const extension = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
    const safeExt = String(extension || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
    const filePath = `bookings/${bookingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, bytes, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message || 'Failed to upload attachment.' }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      path: filePath,
      url: publicData.publicUrl,
      name: originalName,
      type: file.type || 'application/octet-stream',
      uploaded_by: requesterId,
    });
  } catch (error: any) {
    console.error('Chat attachment upload error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload attachment.' }, { status: 500 });
  }
}
