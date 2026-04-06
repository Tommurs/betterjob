import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Runs weekly via Vercel cron (see vercel.json)
// Permanently deletes any job_listing soft-deleted more than 7 days ago
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)

  const { error, count } = await supabase
    .from('job_listings')
    .delete({ count: 'exact' })
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff.toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ purged: count ?? 0 })
}
