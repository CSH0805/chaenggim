import { NextResponse } from 'next/server';
import { withUser } from '@/lib/http';
import { getStats } from '@/lib/stats';

export const runtime = 'nodejs';

export const GET = withUser(async (_req, { user }) => {
  return NextResponse.json({ stats: await getStats(user.id) });
});
