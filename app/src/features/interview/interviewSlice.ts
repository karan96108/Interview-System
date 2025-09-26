import { createSlice, nanoid } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import dayjs from 'dayjs'
import {
  generateInterviewQuestions,
  identifyMissingFields,
  createChatMessage,
  buildSummary,
  evaluateAnswer,
  formatDuration,
} from './utils'
import { QUESTION_DURATIONS } from './questionBank'
import type { AnswerRecord, Candidate, CandidateProfile, InterviewState, QuestionInstance } from './types'
import { prettyFieldName, validateProfileField } from '../../utils/profile'

const initialState: InterviewState = {
  candidates: [],
  activeCandidateId: null,
}

const findCandidate = (state: InterviewState, candidateId?: string | null) =>
  state.candidates.find((candidate) => candidate.id === (candidateId ?? state.activeCandidateId ?? ''))

const startQuestion = (candidate: Candidate, question: QuestionInstance, isFirst = false) => {
  const duration = QUESTION_DURATIONS[question.difficulty]
  candidate.currentQuestionIndex = question.order
  candidate.questionStartedAt = dayjs().toISOString()
  candidate.timer = {
    questionId: question.id,
    remainingSeconds: duration,
    durationSeconds: duration,
    isPaused: false,
  }

  const introLabel = isFirst
    ? 'Great, let\'s start the interview. '
    : 'Next question coming up. '

  candidate.chat.push(
    createChatMessage(
      'assistant',
      `${introLabel}Question ${question.order + 1} (${question.difficulty.toUpperCase()}, ${formatDuration(duration)}).`,
      'info',
      question.id,
    ),
  )
  candidate.chat.push(createChatMessage('assistant', question.prompt, 'question', question.id))
}

const completeInterview = (candidate: Candidate) => {
  const totalScore = candidate.answers.reduce((acc, answer) => acc + answer.score, 0)
  candidate.totalScore = Math.round(totalScore)
  candidate.summary = buildSummary(candidate)
  candidate.status = 'completed'
  candidate.timer = null
  candidate.questionStartedAt = null
  candidate.updatedAt = dayjs().toISOString()
  candidate.lastInteractionAt = candidate.updatedAt
  candidate.chat.push(
    createChatMessage(
      'assistant',
      `That wraps up the interview. Your total score is ${candidate.totalScore}. ${candidate.summary}`,
    ),
  )
}

const handleAnswer = (candidate: Candidate, response: string, autoSubmitted: boolean): boolean => {
  if (candidate.currentQuestionIndex < 0 || candidate.currentQuestionIndex >= candidate.questions.length) {
    return false
  }
  const question = candidate.questions[candidate.currentQuestionIndex]
  const duration = QUESTION_DURATIONS[question.difficulty]
  const elapsed = candidate.timer
    ? candidate.timer.durationSeconds - candidate.timer.remainingSeconds
    : candidate.questionStartedAt
      ? Math.max(0, dayjs().diff(candidate.questionStartedAt, 'second'))
      : duration
  const elapsedSeconds = Math.max(1, Math.min(duration, elapsed))
  const { score, feedback } = evaluateAnswer(question, response, elapsedSeconds)
  const record: AnswerRecord = {
    questionId: question.id,
    response: response.trim() || 'No response provided.',
    submittedAt: dayjs().toISOString(),
    timeTakenSeconds: elapsedSeconds,
    autoSubmitted,
    score,
    feedback,
  }
  candidate.answers.push(record)
  candidate.updatedAt = record.submittedAt
  candidate.lastInteractionAt = record.submittedAt
  candidate.chat.push(
    createChatMessage(
      'assistant',
      `Crisp feedback: ${feedback} (Score ${score}).`,
      'info',
      question.id,
    ),
  )
  candidate.timer = null
  candidate.questionStartedAt = null

  const isFinalQuestion = candidate.currentQuestionIndex === candidate.questions.length - 1

  if (isFinalQuestion) {
    completeInterview(candidate)
    return true
  }

  const nextQuestion = candidate.questions[candidate.currentQuestionIndex + 1]
  if (nextQuestion) {
    startQuestion(candidate, nextQuestion)
  }
  return false
}

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startCandidate: (
      state,
      action: PayloadAction<{ profile: CandidateProfile }>,
    ) => {
      const { profile } = action.payload
      const timestamp = dayjs().toISOString()
      const candidate: Candidate = {
        id: nanoid(),
        profile: { ...profile },
        createdAt: timestamp,
        updatedAt: timestamp,
        lastInteractionAt: timestamp,
        status: 'collecting-profile',
        chat: [],
        questions: [],
        answers: [],
        currentQuestionIndex: -1,
        timer: null,
        questionStartedAt: null,
        pendingProfileFields: identifyMissingFields(profile),
        welcomeShown: true,
      }

      candidate.chat.push(
        createChatMessage(
          'assistant',
          'Hi! I\'m Crisp, your AI interview assistant. Thanks for uploading your resume — let me take a quick look.',
        ),
      )

      const extractedDetails = [
        profile.name ? `Name: ${profile.name}` : null,
        profile.email ? `Email: ${profile.email}` : null,
        profile.phone ? `Phone: ${profile.phone}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      candidate.chat.push(
        createChatMessage(
          'assistant',
          extractedDetails
            ? `Here\'s what I captured from your resume:\n${extractedDetails}`
            : 'I could not find contact details in the resume.',
        ),
      )

      if (candidate.pendingProfileFields.length) {
        const field = candidate.pendingProfileFields[0]
        candidate.chat.push(
          createChatMessage(
            'assistant',
            `Before we dive in, could you share your ${prettyFieldName(field)}?`,
          ),
        )
      } else {
        candidate.questions = generateInterviewQuestions()
        candidate.status = 'in-progress'
        candidate.chat.push(
          createChatMessage(
            'assistant',
            'We will work through 6 questions: 2 easy, 2 medium, and 2 hard. Each question has a timer, so answer when you are ready.',
          ),
        )
        if (candidate.questions[0]) {
          startQuestion(candidate, candidate.questions[0], true)
        }
      }

      state.candidates.push(candidate)
      state.activeCandidateId = candidate.id
    },
    markWelcomeSeen: (state) => {
      const candidate = findCandidate(state)
      if (candidate) {
        candidate.welcomeShown = true
      }
    },
    processUserMessage: (state, action: PayloadAction<{ message: string }>) => {
      const candidate = findCandidate(state)
      if (!candidate) {
        return
      }

      const trimmed = action.payload.message.trim()
      if (!trimmed) {
        return
      }

      candidate.chat.push(
        createChatMessage(
          'user',
          trimmed,
          candidate.pendingProfileFields.length ? 'info' : 'answer',
          candidate.timer?.questionId,
        ),
      )
      candidate.updatedAt = dayjs().toISOString()
      candidate.lastInteractionAt = candidate.updatedAt

      if (candidate.pendingProfileFields.length) {
        const field = candidate.pendingProfileFields[0]
        const validationError = validateProfileField(field, trimmed)
        if (validationError) {
          candidate.chat.push(createChatMessage('assistant', validationError))
          candidate.chat.push(
            createChatMessage('assistant', `Please share a valid ${prettyFieldName(field)}.`),
          )
          return
        }
        candidate.profile[field] = trimmed
        candidate.pendingProfileFields.shift()
        candidate.chat.push(
          createChatMessage('assistant', `Thanks for confirming your ${prettyFieldName(field)}.`),
        )

        if (candidate.pendingProfileFields.length) {
          const nextField = candidate.pendingProfileFields[0]
          candidate.chat.push(
            createChatMessage(
              'assistant',
              `Got it. I also need your ${prettyFieldName(nextField)}.`,
            ),
          )
        } else {
          candidate.questions = generateInterviewQuestions()
          candidate.status = 'in-progress'
          candidate.chat.push(
            createChatMessage(
              'assistant',
              'Perfect! We will work through 6 questions — 2 easy, 2 medium, 2 hard — each with its own timer.',
            ),
          )
          if (candidate.questions[0]) {
            startQuestion(candidate, candidate.questions[0], true)
          }
        }
        return
      }

      const finished = handleAnswer(candidate, trimmed, false)
      if (finished) {
        state.activeCandidateId = null
      }
    },
    tickTimer: (state) => {
      const candidate = findCandidate(state)
      if (!candidate || !candidate.timer || candidate.status !== 'in-progress') {
        return
      }
      if (candidate.timer.isPaused) {
        return
      }
      candidate.timer.remainingSeconds = Math.max(0, candidate.timer.remainingSeconds - 1)
      if (candidate.timer.remainingSeconds === 0) {
        candidate.chat.push(
          createChatMessage(
            'assistant',
            'Time is up for this question. Moving to the next one.',
            'info',
            candidate.timer.questionId,
          ),
        )
        const finished = handleAnswer(candidate, '', true)
        if (finished) {
          state.activeCandidateId = null
        }
      }
    },
    pauseInterview: (state) => {
      const candidate = findCandidate(state)
      if (!candidate || !candidate.timer) {
        return
      }
      candidate.status = 'paused'
      candidate.timer.isPaused = true
      candidate.updatedAt = dayjs().toISOString()
      candidate.lastInteractionAt = candidate.updatedAt
      candidate.welcomeShown = false
      candidate.chat.push(createChatMessage('assistant', 'Sure, I\'ll pause here. Let me know when you are ready.'))
    },
    resumeInterview: (state) => {
      const candidate = findCandidate(state)
      if (!candidate) {
        return
      }
      if (candidate.status === 'completed') {
        return
      }
      candidate.status = 'in-progress'
      if (candidate.timer) {
        candidate.timer.isPaused = false
      } else if (candidate.questions.length && candidate.currentQuestionIndex >= 0) {
        const index = candidate.currentQuestionIndex
        const question = candidate.questions[index]
        if (question) {
          startQuestion(candidate, question)
        }
      }
      candidate.updatedAt = dayjs().toISOString()
      candidate.lastInteractionAt = candidate.updatedAt
      candidate.welcomeShown = true
      candidate.chat.push(createChatMessage('assistant', 'Welcome back! Picking up where we left off.'))
    },
    setActiveCandidateId: (state, action: PayloadAction<string | null>) => {
      state.activeCandidateId = action.payload
    },
    resetActiveCandidate: (state) => {
      if (!state.activeCandidateId) {
        return
      }
      const candidate = findCandidate(state)
      if (candidate && candidate.status !== 'completed') {
        state.candidates = state.candidates.filter((item) => item.id !== state.activeCandidateId)
      }
      state.activeCandidateId = null
    },
  },
})

export const {
  startCandidate,
  processUserMessage,
  tickTimer,
  pauseInterview,
  resumeInterview,
  markWelcomeSeen,
  setActiveCandidateId,
  resetActiveCandidate,
} = interviewSlice.actions

export default interviewSlice.reducer
