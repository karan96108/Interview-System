export type Difficulty = 'easy' | 'medium' | 'hard'

export interface QuestionTemplate {
  id: string
  prompt: string
  difficulty: Difficulty
  topics: string[]
  keywords: string[]
  sampleAnswer: string
}

export interface QuestionInstance extends QuestionTemplate {
  order: number
}

export interface CandidateProfile {
  name?: string
  email?: string
  phone?: string
  resumeText?: string
  resumeFile?: {
    name: string
    type: string
    dataUrl: string
  }
}

export interface ChatMessage {
  id: string
  role: 'assistant' | 'user' | 'system'
  content: string
  timestamp: string
  questionId?: string
  intent?: 'question' | 'answer' | 'info'
}

export interface AnswerRecord {
  questionId: string
  response: string
  submittedAt: string
  timeTakenSeconds: number
  autoSubmitted: boolean
  score: number
  feedback: string
}

export type ProfileField = 'name' | 'email' | 'phone'

export interface TimerState {
  questionId: string
  remainingSeconds: number
  durationSeconds: number
  isPaused: boolean
}

export interface Candidate {
  id: string
  profile: CandidateProfile
  createdAt: string
  updatedAt: string
  lastInteractionAt: string
  status: 'collecting-profile' | 'in-progress' | 'paused' | 'completed'
  chat: ChatMessage[]
  questions: QuestionInstance[]
  answers: AnswerRecord[]
  currentQuestionIndex: number
  timer: TimerState | null
  questionStartedAt: string | null
  pendingProfileFields: ProfileField[]
  welcomeShown: boolean
  summary?: string
  totalScore?: number
}

export interface InterviewState {
  candidates: Candidate[]
  activeCandidateId: string | null
}
