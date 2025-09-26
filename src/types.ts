export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'candidate' | 'system';
  content: string;
  timestamp: string;
}

export interface InterviewQuestion {
  id: string;
  prompt: string;
  difficulty: Difficulty;
  keywords: string[];
  duration: number;
  answer?: string;
  autoSubmitted?: boolean;
  score?: number;
}

export type CandidateStatus = 'collecting' | 'inProgress' | 'paused' | 'completed';

export interface Candidate {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  resumeFilename: string;
  resumeText: string;
  createdAt: string;
  completedAt?: string;
  status: CandidateStatus;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  chat: ChatMessage[];
  summary?: string;
  totalScore?: number;
  missingFields: Array<'name' | 'email' | 'phone'>;
  timers: {
    remainingSeconds?: number;
    lastUpdated?: string;
  };
}

export interface StartCandidatePayload {
  resumeFilename: string;
  resumeText: string;
  extracted: {
    name?: string;
    email?: string;
    phone?: string;
  };
}
