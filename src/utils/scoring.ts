import { Candidate, InterviewQuestion } from '../types';

export const maxScoreByDifficulty: Record<InterviewQuestion['difficulty'], number> = {
  easy: 10,
  medium: 15,
  hard: 20
};

const difficultyLabels: Record<InterviewQuestion['difficulty'], string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard'
};

export const scoreAnswer = (answer: string, question: InterviewQuestion) => {
  if (!answer?.trim()) {
    return 0;
  }

  const normalized = answer.toLowerCase();
  const keywordMatches = question.keywords.reduce((score, keyword) => {
    return normalized.includes(keyword.toLowerCase()) ? score + 1 : score;
  }, 0);

  const keywordScore = keywordMatches / question.keywords.length;
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const lengthScore = Math.min(wordCount / 80, 1);
  const balance = 0.65 * keywordScore + 0.35 * lengthScore;

  return Math.round(maxScoreByDifficulty[question.difficulty] * balance);
};

export const calculateTotalScore = (questions: InterviewQuestion[]) => {
  return questions.reduce((sum, question) => sum + (question.score ?? 0), 0);
};

const describePerformance = (candidate: Candidate) => {
  const answered = candidate.questions.filter((question) => question.answer);
  if (!answered.length) {
    return 'No answers were recorded during the interview.';
  }

  const best = [...answered].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  const weakest = [...answered].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];

  return `Top performance on ${difficultyLabels[best.difficulty]} question: "${best.prompt}". ` +
    `Needs improvement on ${difficultyLabels[weakest.difficulty]} question: "${weakest.prompt}".`;
};

export const generateSummary = (candidate: Candidate) => {
  if (candidate.questions.every((question) => !question.answer)) {
    return 'The candidate did not provide answers for the interview questions.';
  }

  const totalScore = candidate.totalScore ?? 0;
  let qualitative: string;

  if (totalScore >= 80) {
    qualitative = 'Outstanding full-stack knowledge with clear, structured answers.';
  } else if (totalScore >= 60) {
    qualitative = 'Strong understanding with room for deeper technical detail on advanced topics.';
  } else if (totalScore >= 40) {
    qualitative = 'Moderate proficiency; follow-up recommended on complex architecture and testing.';
  } else {
    qualitative = 'Limited responses; consider re-evaluating core fundamentals before proceeding.';
  }

  return `${qualitative} ${describePerformance(candidate)}`;
};
