import type { CandidateProfile, ProfileField } from '../features/interview/types'

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/

const normaliseLine = (line: string) => line.replace(/\s+/g, ' ').trim()

export const extractProfileFromText = (text: string): CandidateProfile => {
  const lines = text
    .split(/\n+/)
    .map((line) => normaliseLine(line))
    .filter(Boolean)

  const emailMatch = text.match(EMAIL_REGEX)
  const phoneMatch = text.match(PHONE_REGEX)

  const likelyNameLine = lines.find((line) => {
    const words = line.split(' ')
    const hasDigits = /\d/.test(line)
    return words.length <= 5 && words.length >= 2 && !hasDigits
  })

  return {
    name: likelyNameLine,
    email: emailMatch?.[0],
    phone: phoneMatch?.[0]?.replace(/\s+/g, ' '),
    resumeText: text,
  }
}

export const validateProfileField = (field: ProfileField, value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'This field is required.'
  }
  if (field === 'email' && !EMAIL_REGEX.test(trimmed)) {
    return 'Please provide a valid email address.'
  }
  if (field === 'phone') {
    const digits = trimmed.replace(/\D/g, '')
    if (digits.length < 9) {
      return 'Please provide a valid phone number.'
    }
  }
  return null
}

export const prettyFieldName = (field: ProfileField) =>
  ({
    name: 'full name',
    email: 'email address',
    phone: 'phone number',
  }[field])
