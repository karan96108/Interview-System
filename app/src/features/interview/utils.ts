import dayjs from 'dayjs'
import { v4 as uuid } from 'uuid'
import { QUESTION_BANK, QUESTION_DURATIONS, DIFFICULTY_SEQUENCE } from './questionBank'
import type {
  AnswerRecord,
  Candidate,
  CandidateProfile,
  Difficulty,
  ProfileField,
  QuestionInstance,
  QuestionTemplate,
} from './types'

export const formatTimestamp = () => dayjs().toISOString()

const difficultyWeight: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
}

const REQUIRED_FIELDS: ProfileField[] = ['name', 'email', 'phone']

export const identifyMissingFields = (profile: CandidateProfile): ProfileField[] =>
  REQUIRED_FIELDS.filter((field) => {
    const value = profile[field]
    return !value || !value.trim()
  })

export const generateInterviewQuestions = (): QuestionInstance[] => {
  const clones: Record<Difficulty, QuestionTemplate[]> = {
    easy: [...QUESTION_BANK.easy],
    medium: [...QUESTION_BANK.medium],
    hard: [...QUESTION_BANK.hard],
  }

  return DIFFICULTY_SEQUENCE.map((difficulty, index) => {
    const pool = clones[difficulty]
    const choiceIndex = Math.floor(Math.random() * pool.length)
    const template = pool.splice(choiceIndex, 1)[0]
    return { ...template, order: index }
  })
}

const difficultyFeedback = (difficulty: Difficulty, coverage: number) => {
  if (coverage > 0.8) {
    return {
      easy: 'Great clarity on the fundamentals.',
      medium: 'Solid command of mid-level concepts.',
      hard: 'Excellent depth on a complex subject.',
    }[difficulty]
  }
  if (coverage > 0.5) {
    return {
      easy: 'Good answer with room to add a bit more detail.',
      medium: 'Covers the essentials; expanding examples would improve it.',
      hard: 'Touches on critical points but could dive deeper.',
    }[difficulty]
  }
  return {
    easy: 'Consider reinforcing the basics for a stronger answer.',
    medium: 'Try to connect more implementation detail next time.',
    hard: 'Focus on structuring a strategy before jumping to solutions.',
  }[difficulty]
}

export const evaluateAnswer = (
  question: QuestionInstance,
  answer: string,
  elapsedSeconds: number,
): Pick<AnswerRecord, 'score' | 'feedback'> => {
  const text = answer.toLowerCase()
  const keywords = question.keywords.map((keyword) => keyword.toLowerCase())
  const matchedKeywords = keywords.filter((keyword) => text.includes(keyword))
  const coverage = keywords.length ? matchedKeywords.length / keywords.length : 0
  const richness = Math.min(answer.trim().split(/\s+/).length / 60, 1)
  const durationScore = Math.max(0.6, Math.min(1, elapsedSeconds / QUESTION_DURATIONS[question.difficulty]))
  const rawScore = (coverage * 0.6 + richness * 0.25 + durationScore * 0.15) * 10 * difficultyWeight[question.difficulty]
  const score = Math.round(Math.min(10 * difficultyWeight[question.difficulty], rawScore))

  const missing = keywords.filter((keyword) => !matchedKeywords.includes(keyword))
  const feedbackSegments = [difficultyFeedback(question.difficulty, coverage)]
  if (matchedKeywords.length) {
    feedbackSegments.push(`Strong mentions: ${matchedKeywords.join(', ')}.`)
  }
  if (missing.length) {
    feedbackSegments.push(`Consider elaborating on: ${missing.join(', ')}.`)
  }

  return {
    score,
    feedback: feedbackSegments.join(' '),
  }
}

export const buildSummary = (candidate: Candidate) => {
  const totalScore = candidate.answers.reduce((acc, answer) => acc + answer.score, 0)
  const averageScore = candidate.answers.length ? totalScore / candidate.answers.length : 0
  const hardScore = averageScore >= 15
  const pace = candidate.answers.reduce((acc, answer) => acc + answer.timeTakenSeconds, 0) /
    (candidate.answers.length || 1)

  const highlight = hardScore
    ? 'demonstrated senior-level thinking on advanced problems'
    : averageScore > 10
      ? 'showed solid practical knowledge across the stack'
      : 'has foundational knowledge but should reinforce advanced topics'

  const paceRemark = pace <= 45
    ? 'responded quickly and decisively'
    : pace <= 90
      ? 'maintained a thoughtful pace'
      : 'took additional time on several questions'

  return `Crisp observed that ${candidate.profile.name ?? 'the candidate'} ${highlight}. They ${paceRemark} and earned a total score of ${Math.round(totalScore)}.`
}

export const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) {
    return `${secs}s`
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
}

export const toDataUrl = async (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to convert file to data url'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

export const createChatMessage = (
  role: 'assistant' | 'user' | 'system',
  content: string,
  intent: 'question' | 'answer' | 'info' = 'info',
  questionId?: string,
) => ({
  id: uuid(),
  role,
  content,
  intent,
  questionId,
  timestamp: formatTimestamp(),
})
