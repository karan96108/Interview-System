import type { Difficulty, QuestionTemplate } from './types'

const createQuestion = (
  id: string,
  difficulty: Difficulty,
  prompt: string,
  keywords: string[],
  sampleAnswer: string,
  topics: string[],
): QuestionTemplate => ({ id, difficulty, prompt, keywords, sampleAnswer, topics })

export const QUESTION_BANK: Record<Difficulty, QuestionTemplate[]> = {
  easy: [
    createQuestion(
      'easy-frontend-state',
      'easy',
      'Can you explain the difference between local component state and global application state in React?',
      ['local state', 'global state', 'context', 'redux', 'prop drilling'],
      'Local state belongs to a single component and is managed with hooks like useState, whereas global state is shared across multiple components and often managed with Context, Redux, or other libraries to avoid prop drilling.',
      ['react', 'state management'],
    ),
    createQuestion(
      'easy-node-event-loop',
      'easy',
      'What is the Node.js event loop responsible for?',
      ['non-blocking', 'asynchronous', 'callbacks', 'single-threaded'],
      'The event loop allows Node.js to perform non-blocking I/O by queueing callbacks and executing them on a single thread as operations finish.',
      ['nodejs', 'runtime'],
    ),
    createQuestion(
      'easy-http-codes',
      'easy',
      'What does a 404 HTTP status code represent?',
      ['not found', 'resource', 'client error'],
      'A 404 status code signals a client error indicating the requested resource could not be found on the server.',
      ['web'],
    ),
    createQuestion(
      'easy-css-flex',
      'easy',
      'When would you choose CSS Flexbox over CSS Grid?',
      ['one-dimensional', 'layout', 'row', 'column'],
      'Flexbox is best for one-dimensional layouts (either rows or columns), while Grid excels at two-dimensional layouts.',
      ['css'],
    ),
  ],
  medium: [
    createQuestion(
      'medium-react-performance',
      'medium',
      'How do you optimize re-renders in a large React application?',
      ['memoization', 'useMemo', 'useCallback', 'memo', 'virtualization'],
      'Memoization hooks such as useMemo/useCallback, React.memo for components, and list virtualization help avoid unnecessary renders.',
      ['react', 'performance'],
    ),
    createQuestion(
      'medium-api-design',
      'medium',
      'Design an API endpoint to fetch paginated interview results. What considerations matter?',
      ['pagination', 'filters', 'sorting', 'validation', 'status codes'],
      'The endpoint should accept pagination params, optional filters/sorting, validate inputs, and return a consistent schema with metadata and proper status codes.',
      ['api', 'nodejs'],
    ),
    createQuestion(
      'medium-database-modeling',
      'medium',
      'How would you model interview sessions in a database for analytics?',
      ['entities', 'relationships', 'candidate', 'questions', 'scores'],
      'Separate tables/collections for candidates, sessions, questions, and responses with relationships enable flexible analytics and history tracking.',
      ['database'],
    ),
    createQuestion(
      'medium-node-testing',
      'medium',
      'How do you test an Express.js API effectively?',
      ['integration tests', 'unit tests', 'supertest', 'jest', 'mocks'],
      'Use unit tests for isolated logic, integration tests with tools like Supertest + Jest, and mock external dependencies to verify behaviour.',
      ['testing'],
    ),
  ],
  hard: [
    createQuestion(
      'hard-system-design',
      'hard',
      'Design a scalable architecture for a live coding interview platform that supports AI feedback.',
      ['microservices', 'scalability', 'websocket', 'ai services', 'queue'],
      'A scalable design might use microservices, managed queues for AI scoring, WebSocket channels for live updates, and autoscaling compute for AI workloads.',
      ['system design'],
    ),
    createQuestion(
      'hard-performance-budget',
      'hard',
      'You need to optimize bundle size for a large React SPA. Describe your strategy.',
      ['code splitting', 'lazy loading', 'tree shaking', 'analyze bundle', 'performance budget'],
      'Adopt performance budgets, analyze bundles, leverage code splitting/lazy loading, tree shaking, and monitor with tooling like webpack-bundle-analyzer.',
      ['performance'],
    ),
    createQuestion(
      'hard-security',
      'hard',
      'How would you secure a Node.js API that handles sensitive candidate data?',
      ['authentication', 'authorization', 'encryption', 'rate limiting', 'audit logs'],
      'Implement strong auth, granular authorization, encrypt data in transit/at rest, add rate limiting, validation, and audit logging.',
      ['security'],
    ),
    createQuestion(
      'hard-resilience',
      'hard',
      'Explain how you would build resilience into a distributed interview scheduling system.',
      ['circuit breaker', 'retries', 'idempotency', 'monitoring', 'failover'],
      'Use retries with backoff, circuit breakers, idempotent operations, and active monitoring/failover to improve resilience.',
      ['distributed systems'],
    ),
  ],
}

export const DIFFICULTY_SEQUENCE: Difficulty[] = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard']

export const QUESTION_DURATIONS: Record<Difficulty, number> = {
  easy: 20,
  medium: 60,
  hard: 120,
}
