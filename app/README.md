# Crisp — AI-Powered Interview Assistant

Crisp is a React + Redux web application that simulates a full-stack interview. Candidates upload a resume, chat with an AI interviewer, and receive automated scoring. Hiring teams can follow along in a synchronized dashboard that keeps every interview transcript, score, and summary.

## ✨ Features

- **Resume ingestion** – Accepts PDF/DOCX files and extracts the candidate's name, email, and phone number. Missing fields are collected via chat before the interview starts.
- **Structured interview flow** – Six adaptive questions (2 Easy → 2 Medium → 2 Hard) with per-question timers (20/60/120 seconds). Answers auto-submit when time expires.
- **AI-style scoring** – Keyword-based evaluation produces per-question feedback, a total score, and an auto-generated summary of the candidate.
- **Dual experience** – Interviewee chat and interviewer dashboard are synchronized in real time. The dashboard supports search, sorting, and deep dives into chat transcripts and scoring breakdowns.
- **Session persistence** – Redux + `redux-persist` keep timers, answers, and chat history in local storage. A “Welcome Back” modal lets candidates resume paused interviews.
- **Pause & resume** – Candidates can pause an interview; the dashboard reflects the paused state and resumes timers once the interview continues.

## 🛠 Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) for bundling and dev tooling
- [Redux Toolkit](https://redux-toolkit.js.org/) + [redux-persist](https://github.com/rt2zz/redux-persist) for state management and local persistence
- [Ant Design](https://ant.design/) component library
- [`pdfjs-dist`](https://github.com/mozilla/pdf.js/) & [`mammoth`](https://github.com/mwilliamson/mammoth.js) for resume parsing

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev

# Type-check and build for production
npm run build
```

The dev server starts on [http://localhost:5173](http://localhost:5173). All interview data persists in the browser, so clearing local storage resets the app.

## 🧭 Project Structure

```
app/
├── src/
│   ├── app/                 # Redux store setup & typed hooks
│   ├── components/          # Interviewee chat + interviewer dashboard UI
│   ├── features/interview/  # State slice, question bank, scoring logic
│   └── utils/               # Resume parsing & profile extraction helpers
├── public/
└── docs/                    # Assignment brief
```

## 📄 Resume Parsing

- PDFs are parsed with `pdfjs-dist`; DOCX files use `mammoth`.
- The parser extracts contact details heuristically and stores a base64 data URL of the resume for persistence.
- Input validation ensures only supported file types are accepted.

## ♻️ Persistence & Welcome Back Flow

- Interviews persist via `redux-persist` in `localStorage`.
- Pausing an interview marks the session for a “Welcome Back” prompt the next time the candidate returns.
- Restarting removes unfinished interviews while completed interviews remain accessible in the dashboard.

## ✅ Testing

`npm run build` runs TypeScript compilation and a production build. Additional tests can be added via your preferred runner (Jest, Vitest, etc.).

---

This project was built for Swipe's AI-powered interview assignment and is ready to deploy to Vercel, Netlify, or any static hosting platform that serves the Vite build output.
