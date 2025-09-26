# Crisp — AI-Powered Interview Assistant

This project implements an AI-guided mock interview platform tailored for full-stack (React/Node) candidates. It was built as part of the Swipe Internship assignment and showcases both the candidate-facing interview flow and the interviewer dashboard in a single responsive React application.

## Features

- **Resume ingestion** – Upload PDF or DOCX resumes and automatically extract key contact details (name, email, phone). If anything is missing, the chat assistant requests it before proceeding.
- **Adaptive interview chat** – A six-question session (2 easy, 2 medium, 2 hard) with dynamic timing, auto-submission on timeout, and per-question AI scoring.
- **Persistent progress** – All interview state (messages, timers, answers, scores) is saved locally using Redux Toolkit + redux-persist. Refreshing or closing the tab will restore the latest progress and display a “Welcome Back” prompt.
- **Pause & resume** – Candidates can pause at any point and resume seamlessly with preserved timers.
- **Interviewer dashboard** – View all candidates ordered by final score, search/filter, inspect per-question feedback, and replay the full chat transcript.

## Tech Stack

- React 18 + TypeScript with Vite
- Ant Design component library for UI
- Redux Toolkit & redux-persist for state and local storage
- `pdfjs-dist` and `mammoth` for resume text extraction

## Running Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) to try the experience.

To create a production build:

```bash
npm run build
```

## Notes

- Resume parsing happens entirely in-browser; no external services are required.
- Question scoring is heuristic-based and highlights strengths/weaknesses for the interviewer summary.
- The repository also includes the original assignment brief under `docs/`.
