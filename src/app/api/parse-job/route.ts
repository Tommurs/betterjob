import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic()

const VALID_TYPES = ['full_time', 'part_time', 'contract', 'temporary']
const VALID_EXPERIENCE = [
  '6 months', '1 year', '2 years', '3 years', '4 years', '5 years',
  '6 years', '7 years', '8 years', '9 years', '10 years', '11 years',
  '12 years', '13 years', '14 years', '15+ years',
]

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Parser not configured.' }, { status: 500 })
  }

  const { text } = await request.json()
  if (!text?.trim()) {
    return NextResponse.json({ error: 'No text provided.' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    system: `You are a job listing parser. Extract structured data from job descriptions and return ONLY valid JSON — no explanation, no markdown, no code fences. If a field cannot be confidently determined, use null.`,
    messages: [
      {
        role: 'user',
        content: `Extract the following fields from this job listing. Return ONLY a raw JSON object.

Rules:
- "type" must be one of: ${VALID_TYPES.join(', ')} — pick the closest match or null
- "experience_min" and "experience_max" must each be one of: ${VALID_EXPERIENCE.join(', ')} — or null
- "salary_min" and "salary_max" must be annual integers in USD (convert hourly/monthly if needed), or null
- "requirements" must be an array of concise individual strings (not a single block of text)
- "description" should be the role summary/responsibilities, cleaned up — not the full raw text

JSON shape:
{
  "title": string | null,
  "company": string | null,
  "location": string | null,
  "type": string | null,
  "salary_min": number | null,
  "salary_max": number | null,
  "experience_min": string | null,
  "experience_max": string | null,
  "description": string | null,
  "requirements": string[]
}

Job listing:
${text}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response from parser.' }, { status: 500 })
  }

  try {
    const parsed = JSON.parse(content.text)

    // Sanitise — reject invalid enum values so they don't break the form
    if (parsed.type && !VALID_TYPES.includes(parsed.type)) parsed.type = null
    if (parsed.experience_min && !VALID_EXPERIENCE.includes(parsed.experience_min)) parsed.experience_min = null
    if (parsed.experience_max && !VALID_EXPERIENCE.includes(parsed.experience_max)) parsed.experience_max = null

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Could not parse the response. Please try again.' }, { status: 500 })
  }
}
