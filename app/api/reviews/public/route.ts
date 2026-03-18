import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const maskCustomerName = (firstName?: string | null, surname?: string | null) => {
  const first = (firstName || '').trim();
  const last = (surname || '').trim();

  if (!first && !last) return 'Anonymous Customer';

  const firstMasked = first ? `${first.charAt(0).toUpperCase()}${first.length > 1 ? '*'.repeat(Math.min(first.length - 1, 3)) : ''}` : '';
  const lastMasked = last ? `${last.charAt(0).toUpperCase()}${last.length > 1 ? '*'.repeat(Math.min(last.length - 1, 3)) : ''}` : '';

  return `${firstMasked} ${lastMasked}`.trim();
};

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server is missing Supabase configuration.' }, { status: 500 });
    }

    // Service-role client bypasses RLS so public endpoint can safely return masked review data.
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('id, user_id, service, rating, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = Array.from(
      new Set((data || []).map((review: any) => review.user_id).filter(Boolean))
    );

    const profileMap = new Map<string, { first_name?: string | null; surname?: string | null }>();

    if (userIds.length) {
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, surname')
        .in('id', userIds);

      if (profilesError) {
        return NextResponse.json({ error: profilesError.message }, { status: 500 });
      }

      (profilesData || []).forEach((profile: any) => {
        profileMap.set(profile.id, {
          first_name: profile.first_name,
          surname: profile.surname,
        });
      });
    }

    const reviews = (data || []).map((review: any) => {
      const profile = profileMap.get(review.user_id) || null;
      return {
        id: review.id,
        service: review.service || 'General Service',
        rating: Number(review.rating || 0),
        comment: review.comment || '',
        created_at: review.created_at,
        customerName: maskCustomerName(profile?.first_name, profile?.surname),
      };
    });

    return NextResponse.json({ reviews });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
