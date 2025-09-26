import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Candidate, ChatMessage, InterviewQuestion, StartCandidatePayload } from '../types';
import { generateInterviewQuestions } from '../data/questionBank';
import { calculateTotalScore, generateSummary, maxScoreByDifficulty, scoreAnswer } from '../utils/scoring';
import { fillFieldFromInput } from '../utils/resumeParser';

interface CandidatesState {
  candidates: Candidate[];
  activeCandidateId?: string;
}

const initialState: CandidatesState = {
  candidates: [],
  activeCandidateId: undefined
};

const formatMissingList = (fields: Array<'name' | 'email' | 'phone'>) => {
  return fields
    .map((field) => {
      if (field === 'name') return 'full name';
      if (field === 'email') return 'email address';
      return 'phone number';
    })
    .join(' and ');
};

const questionIntro = (question: InterviewQuestion, index: number, total: number) => {
  const label = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);
  return `Question ${index + 1}/${total} — ${label} (${question.duration}s). ${question.prompt}`;
};

const pushAssistantMessage = (candidate: Candidate, content: string) => {
  const message: ChatMessage = {
    id: uuidv4(),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString()
  };
  candidate.chat.push(message);
};

const beginInterview = (candidate: Candidate) => {
  const now = new Date().toISOString();
  pushAssistantMessage(
    candidate,
    "Great, I have everything I need. Let's begin your full-stack interview."
  );

  const firstQuestion = candidate.questions[0];
  pushAssistantMessage(candidate, questionIntro(firstQuestion, 0, candidate.questions.length));
  candidate.status = 'inProgress';
  candidate.currentQuestionIndex = 0;
  candidate.timers.remainingSeconds = firstQuestion.duration;
  candidate.timers.lastUpdated = now;
};

const advanceInterview = (candidate: Candidate) => {
  const now = new Date().toISOString();
  const nextIndex = candidate.currentQuestionIndex + 1;
  const totalQuestions = candidate.questions.length;

  if (nextIndex >= totalQuestions) {
    candidate.status = 'completed';
    candidate.completedAt = now;
    candidate.totalScore = calculateTotalScore(candidate.questions);
    candidate.summary = generateSummary(candidate);
    pushAssistantMessage(
      candidate,
      `Thank you! That concludes the interview. Your final score is ${candidate.totalScore}.\n${candidate.summary}`
    );
    candidate.timers = {};
    return;
  }

  candidate.currentQuestionIndex = nextIndex;
  const question = candidate.questions[nextIndex];
  candidate.timers.remainingSeconds = question.duration;
  candidate.timers.lastUpdated = now;
  pushAssistantMessage(candidate, questionIntro(question, nextIndex, totalQuestions));
};

const handleAnswer = (candidate: Candidate, message: ChatMessage, autoSubmitted = false) => {
  const question = candidate.questions[candidate.currentQuestionIndex];
  if (!question) {
    return;
  }

  question.answer = autoSubmitted ? question.answer ?? '' : message.content;
  question.autoSubmitted = autoSubmitted;
  question.score = scoreAnswer(question.answer ?? '', question);
  candidate.timers = {};

  const maxScore = maxScoreByDifficulty[question.difficulty];
  if (autoSubmitted) {
    pushAssistantMessage(
      candidate,
      `Time is up! Moving on to the next question. Score recorded: ${question.score}/${maxScore}.`
    );
  } else {
    pushAssistantMessage(
      candidate,
      `Thanks for your answer. My evaluation for this question: ${question.score}/${maxScore}.`
    );
  }

  advanceInterview(candidate);
};

const handleMissingField = (candidate: Candidate, message: ChatMessage) => {
  const missingField = candidate.missingFields[0];

  if (!missingField) {
    beginInterview(candidate);
    return;
  }

  const value = fillFieldFromInput(missingField, message.content);

  if (!value) {
    pushAssistantMessage(
      candidate,
      `I could not detect a valid ${missingField === 'name' ? 'name' : missingField}. Could you please re-enter it?`
    );
    return;
  }

  candidate[missingField] = value;
  candidate.missingFields = candidate.missingFields.slice(1);
  pushAssistantMessage(candidate, `Perfect, thanks for sharing your ${missingField}.`);

  if (candidate.missingFields.length) {
    const nextField = candidate.missingFields[0];
    pushAssistantMessage(
      candidate,
      `Before we begin, could you also provide your ${
        nextField === 'name' ? 'full name' : nextField === 'email' ? 'email address' : 'phone number'
      }?`
    );
  } else {
    beginInterview(candidate);
  }
};

export const candidatesSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    startCandidate: {
      reducer(state, action: PayloadAction<Candidate>) {
        state.candidates = [action.payload, ...state.candidates];
        state.activeCandidateId = action.payload.id;
      },
      prepare(payload: StartCandidatePayload) {
        const id = uuidv4();
        const createdAt = new Date().toISOString();
        const questions = generateInterviewQuestions();
        const missingFields = (['name', 'email', 'phone'] as const).filter(
          (field) => !payload.extracted[field]
        );

        const greeting = `Hi${payload.extracted.name ? ` ${payload.extracted.name}` : ''}! I'm Crisp, your AI interviewer.`;

        const chat: ChatMessage[] = [
          {
            id: uuidv4(),
            role: 'assistant',
            content: greeting,
            timestamp: createdAt
          }
        ];

        if (missingFields.length) {
          chat.push({
            id: uuidv4(),
            role: 'assistant',
            content: `Before we start, could you provide your ${formatMissingList(missingFields)}?`,
            timestamp: createdAt
          });
        } else {
          chat.push({
            id: uuidv4(),
            role: 'assistant',
            content: "Fantastic. Let's jump right in!",
            timestamp: createdAt
          });
          chat.push({
            id: uuidv4(),
            role: 'assistant',
            content: questionIntro(questions[0], 0, questions.length),
            timestamp: createdAt
          });
        }

        const candidate: Candidate = {
          id,
          resumeFilename: payload.resumeFilename,
          resumeText: payload.resumeText,
          name: payload.extracted.name,
          email: payload.extracted.email,
          phone: payload.extracted.phone,
          createdAt,
          status: missingFields.length ? 'collecting' : 'inProgress',
          questions,
          currentQuestionIndex: 0,
          chat,
          summary: undefined,
          totalScore: undefined,
          missingFields: [...missingFields],
          timers: missingFields.length
            ? {}
            : { remainingSeconds: questions[0].duration, lastUpdated: createdAt }
        };

        return { payload: candidate };
      }
    },
    setActiveCandidate(state, action: PayloadAction<string | undefined>) {
      state.activeCandidateId = action.payload;
    },
    submitCandidateMessage: {
      reducer(state, action: PayloadAction<{ candidateId: string; message: ChatMessage }>) {
        const candidate = state.candidates.find((item) => item.id === action.payload.candidateId);
        if (!candidate) return;

        candidate.chat.push(action.payload.message);

        if (candidate.status === 'collecting') {
          handleMissingField(candidate, action.payload.message);
        } else if (candidate.status === 'inProgress') {
          handleAnswer(candidate, action.payload.message);
        }
      },
      prepare({ candidateId, content }: { candidateId: string; content: string }) {
        const message: ChatMessage = {
          id: uuidv4(),
          role: 'candidate',
          content,
          timestamp: new Date().toISOString()
        };
        return { payload: { candidateId, message } };
      }
    },
    tickTimer(state, action: PayloadAction<{ candidateId: string; timestamp: number }>) {
      const candidate = state.candidates.find((item) => item.id === action.payload.candidateId);
      if (!candidate) return;
      if (candidate.status !== 'inProgress') return;
      if (!candidate.timers.remainingSeconds || candidate.timers.remainingSeconds <= 0) {
        return;
      }

      const lastUpdated = candidate.timers.lastUpdated
        ? dayjs(candidate.timers.lastUpdated).valueOf()
        : action.payload.timestamp;
      const elapsedSeconds = Math.floor((action.payload.timestamp - lastUpdated) / 1000);

      if (elapsedSeconds <= 0) {
        return;
      }

      const remaining = Math.max(0, candidate.timers.remainingSeconds - elapsedSeconds);
      candidate.timers.remainingSeconds = remaining;
      candidate.timers.lastUpdated = new Date(action.payload.timestamp).toISOString();

      if (remaining === 0) {
        handleAnswer(candidate, { id: uuidv4(), role: 'candidate', content: '', timestamp: new Date().toISOString() }, true);
      }
    },
    pauseInterview(state, action: PayloadAction<string>) {
      const candidate = state.candidates.find((item) => item.id === action.payload);
      if (!candidate) return;
      if (candidate.status !== 'inProgress') return;
      candidate.status = 'paused';
      candidate.timers.lastUpdated = new Date().toISOString();
      pushAssistantMessage(candidate, 'Interview paused. Let me know when you are ready to resume.');
    },
    resumeInterview(state, action: PayloadAction<string>) {
      const candidate = state.candidates.find((item) => item.id === action.payload);
      if (!candidate) return;
      if (candidate.status !== 'paused') return;
      candidate.status = 'inProgress';
      candidate.timers.lastUpdated = new Date().toISOString();
      pushAssistantMessage(candidate, 'Welcome back! Resuming the interview now.');
    },
    refreshTimerAnchor(state, action: PayloadAction<string>) {
      const candidate = state.candidates.find((item) => item.id === action.payload);
      if (!candidate) return;
      candidate.timers.lastUpdated = new Date().toISOString();
    }
  }
});

export const {
  startCandidate,
  setActiveCandidate,
  submitCandidateMessage,
  tickTimer,
  pauseInterview,
  resumeInterview,
  refreshTimerAnchor
} = candidatesSlice.actions;

export default candidatesSlice.reducer;
