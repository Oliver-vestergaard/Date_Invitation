'use server'

import { headers } from 'next/headers'
import { activities, type Activity } from './date-options'

type DatePlanInput = {
  activity: unknown
  date: unknown
  response: unknown
  startedAt: unknown
  time: unknown
  website: unknown
}

export type SubmitDatePlanResult = {
  message: string
  ok: boolean
}

const recentSubmissions = new Map<string, number[]>()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const emailFinder = /[^\s@()]+@[^\s@()]+\.[^\s@(),.]+/i
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/

function isActivity(value: unknown): value is Activity {
  return typeof value === 'string' && activities.includes(value as Activity)
}

function maskEmail(value: string) {
  const [localPart, domain] = value.split('@')

  if (!localPart || !domain) return null

  return `${localPart.slice(0, 2)}***@${domain}`
}

function hasValidDateParts(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

async function isRateLimited() {
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get('x-forwarded-for')
  const clientId =
    forwardedFor?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const windowStart = now - 60_000
  const recent = (recentSubmissions.get(clientId) ?? []).filter(
    (timestamp) => timestamp > windowStart,
  )

  if (recent.length >= 3) return true

  recent.push(now)
  recentSubmissions.set(clientId, recent)
  return false
}

export async function submitDatePlan(input: DatePlanInput): Promise<SubmitDatePlanResult> {
  if (typeof input.website === 'string' && input.website.length > 0) {
    return { message: 'It’s on its way! ❤️', ok: true }
  }

  if (
    typeof input.startedAt !== 'number' ||
    !Number.isFinite(input.startedAt) ||
    Date.now() - input.startedAt < 1_000
  ) {
    return { message: 'Give it one tiny moment, then try again ❤️', ok: false }
  }

  if (input.response !== 'Yes') {
    return { message: 'That answer does not look quite right yet ❤️', ok: false }
  }

  if (!isActivity(input.activity)) {
    return { message: 'Pick our plan one more time for me ❤️', ok: false }
  }

  if (
    typeof input.date !== 'string' ||
    !datePattern.test(input.date) ||
    !hasValidDateParts(input.date)
  ) {
    return { message: 'Pick our date one more time for me ❤️', ok: false }
  }

  if (typeof input.time !== 'string' || !timePattern.test(input.time)) {
    return { message: 'Pick our time one more time for me ❤️', ok: false }
  }

  if (await isRateLimited()) {
    return { message: 'That’s enough excitement for one minute—try again in a bit ❤️', ok: false }
  }

  const apiKey = process.env.APIKEYZ
  const recipient = process.env.DATE_RESPONSE_EMAIL_V2
  const fromAddress = 'onboarding@resend.dev'

  if (!apiKey || !recipient || !emailPattern.test(recipient)) {
    return {
      message: 'One tiny email setup thing is still missing before this can fly ❤️',
      ok: false,
    }
  }

  const formattedDate = new Intl.DateTimeFormat('en', {
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(new Date(`${input.date}T12:00:00Z`))

  let resendResponse: Response

  try {
    resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Date Invitation <${fromAddress}>`,
        subject: 'A date answer just arrived ❤️',
        text: [
          'The answer is YES ❤️',
          '',
          `Plan: ${input.activity}`,
          `Date: ${formattedDate}`,
          `Time: ${input.time}`,
        ].join('\n'),
        to: [recipient],
      }),
      cache: 'no-store',
    })
  } catch {
    return {
      message: 'The email got a little lost. Please try sending it again ❤️',
      ok: false,
    }
  }

  if (!resendResponse.ok) {
    const resendError = (await resendResponse.json().catch(() => null)) as {
      message?: unknown
      name?: unknown
    } | null
    const errorMessage =
      typeof resendError?.message === 'string' ? resendError.message.toLowerCase() : ''
    const errorName = typeof resendError?.name === 'string' ? resendError.name.toLowerCase() : ''

    if (resendResponse.status === 401 || errorName.includes('invalid_api_key')) {
      return {
        message: 'Resend did not accept the API key. Please create a new Sending access key ❤️',
        ok: false,
      }
    }

    if (
      resendResponse.status === 403 ||
      errorMessage.includes('testing email') ||
      errorMessage.includes('verify a domain')
    ) {
      const accountEmail = errorMessage.match(emailFinder)?.[0]
      const accountHint = accountEmail ? maskEmail(accountEmail) : null

      return {
        message: accountHint
          ? `Resend says this key belongs to ${accountHint}. The receiving email must be that same address ❤️`
          : 'The test sender can only email the address connected to your Resend account. Please double-check that inbox ❤️',
        ok: false,
      }
    }

    if (resendResponse.status === 429 || errorName.includes('rate_limit')) {
      return {
        message: 'Resend needs a little break. Please wait a minute and try again ❤️',
        ok: false,
      }
    }

    return {
      message: 'The email got a little lost. Please try sending it again ❤️',
      ok: false,
    }
  }

  return { message: 'It’s sent! Check your inbox ❤️', ok: true }
}
