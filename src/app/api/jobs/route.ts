import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { jobSchema } from '@/lib/validations/job'

export async function GET() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('job_listings')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = jobSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('job_listings')
    .insert({ ...parsed.data, employer_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
