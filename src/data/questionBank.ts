import { Difficulty, InterviewQuestion } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface QuestionSeed {
  prompt: string;
  difficulty: Difficulty;
  keywords: string[];
}

const QUESTION_SEEDS: QuestionSeed[] = [
  {
    prompt: 'Explain the difference between var, let, and const in JavaScript. When would you use each?',
    difficulty: 'easy',
    keywords: ['scope', 'hoist', 'mutable', 'block', 'reassign']
  },
  {
    prompt: 'How do you lift state up in React? Provide a short example or explanation.',
    difficulty: 'easy',
    keywords: ['state', 'props', 'parent', 'child', 'data flow']
  },
  {
    prompt: 'Describe how you would design a REST API endpoint in Node.js/Express for updating a user profile.',
    difficulty: 'medium',
    keywords: ['put', 'patch', 'validation', 'middleware', 'controller']
  },
  {
    prompt: 'What are React hooks and how do useEffect and useMemo differ?',
    difficulty: 'medium',
    keywords: ['hook', 'effect', 'memo', 'dependencies', 'performance']
  },
  {
    prompt: 'How would you implement server-side rendering (SSR) for a React application? Outline the key steps.',
    difficulty: 'hard',
    keywords: ['ssr', 'hydrate', 'bundle', 'node', 'renderToString']
  },
  {
    prompt: 'Describe an end-to-end testing strategy for a full-stack React/Node application.',
    difficulty: 'hard',
    keywords: ['testing', 'integration', 'cypress', 'jest', 'pipeline']
  },
  {
    prompt: 'What is the difference between SQL and NoSQL databases, and when would you choose one over the other?',
    difficulty: 'easy',
    keywords: ['structured', 'schema', 'document', 'relational', 'scalability']
  },
  {
    prompt: 'Explain how middleware works in Express.js and give a real-world example.',
    difficulty: 'medium',
    keywords: ['middleware', 'request', 'response', 'next', 'logging']
  },
  {
    prompt: 'How do you secure a REST API? Mention authentication and authorization strategies.',
    difficulty: 'hard',
    keywords: ['authentication', 'authorization', 'jwt', 'oauth', 'encryption']
  }
];

const difficultyLimits: Record<Difficulty, number> = {
  easy: 2,
  medium: 2,
  hard: 2
};

export const generateInterviewQuestions = (): InterviewQuestion[] => {
  const grouped: Record<Difficulty, QuestionSeed[]> = {
    easy: [],
    medium: [],
    hard: []
  };

  QUESTION_SEEDS.forEach((seed) => {
    grouped[seed.difficulty].push(seed);
  });

  const result: InterviewQuestion[] = [];

  (Object.keys(difficultyLimits) as Difficulty[]).forEach((level) => {
    const seeds = [...grouped[level]];
    for (let i = seeds.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [seeds[i], seeds[j]] = [seeds[j], seeds[i]];
    }
    seeds.slice(0, difficultyLimits[level]).forEach((seed) => {
      result.push({
        id: uuidv4(),
        prompt: seed.prompt,
        difficulty: seed.difficulty,
        keywords: seed.keywords,
        duration: seed.difficulty === 'easy' ? 20 : seed.difficulty === 'medium' ? 60 : 120
      });
    });
  });

  return result;
};
