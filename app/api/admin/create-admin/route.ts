import { NextResponse } from 'next/server';

// Placeholder route to keep the app build valid until admin creation is implemented.
export async function POST() {
	return NextResponse.json(
		{ error: 'Not implemented. Use /api/admin/create-staff for now.' },
		{ status: 501 }
	);
}

export async function GET() {
	return NextResponse.json({ ok: true, message: 'create-admin route placeholder' });
}
