import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'service-images';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

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
    return { error: NextResponse.json({ error: 'Only admins can upload service images.' }, { status: 403 }) };
  }

  return { supabaseAdmin };
};

const ensureBucket = async (supabaseAdmin: any) => {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    throw new Error(listError.message || 'Unable to list storage buckets.');
  }

  const bucketExists = Array.isArray(buckets) && buckets.some((bucket) => bucket.name === BUCKET_NAME || bucket.id === BUCKET_NAME);
  if (bucketExists) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: `${MAX_IMAGE_SIZE_BYTES}`,
  });

  if (createError && !String(createError.message || '').toLowerCase().includes('already')) {
    throw new Error(createError.message || 'Failed to create storage bucket for service images.');
  }
};

export async function POST(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const { supabaseAdmin } = context;

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required.' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image uploads are supported.' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Image is too large. Maximum allowed size is 5MB.' }, { status: 400 });
    }

    await ensureBucket(supabaseAdmin);

    const originalName = file.name || 'upload.png';
    const extension = originalName.includes('.') ? originalName.split('.').pop() : 'png';
    const safeExt = String(extension || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const filePath = `services/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, bytes, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message || 'Failed to upload image.' }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      path: filePath,
      url: publicData.publicUrl,
    });
  } catch (error: any) {
    console.error('Service image upload error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload image.' }, { status: 500 });
  }
}
