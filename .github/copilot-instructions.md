<!-- Repo-specific Copilot instructions for automated coding agents -->
# Copilot instructions — cms-demo-project

This Node/Express demo is small and intentionally simple. These notes contain the key, discoverable patterns an AI coding agent needs to be productive editing or extending the project.

1) Big picture
- Single-process Node.js Express app. Entry point: `src/index.js`.
- Routes are mounted under `src/routes` and data fixtures live in `src/data` (e.g. `src/data/quiz.js`).
- API surface: the quiz router is mounted at `/api/quiz` (see `app.use("/api/quiz", quizRouter)` in `src/index.js`).
- Data is in-memory JavaScript arrays (no DB). Mutations (POST/PUT/DELETE) modify `src/data/quiz.js` at runtime and are not persisted across restarts.

2) File & coding conventions
- CommonJS modules (require/module.exports). Do not convert files to ES modules unless you update package.json `type` and test the app.
- Keep route handler logic in `src/routes/*` and raw data in `src/data/*`.
- ID generation pattern: new id = (max existing id) + 1. See `src/routes/quiz.js` where new id is computed with `Math.max(...quiz.map(q => q.id))`.
- Validation pattern: handlers check for required fields `question`, `options`, `answer` and return 400 with `{ msg: "Missing required fields" }` when absent.
- Error responses and 404: `src/index.js` adds a JSON 404 handler for unknown routes.

3) Developer workflows / commands
- Start production: `npm start` (runs `node src/index.js`).
- Development (auto-restart/watch): `npm run dev` (runs `node --watch src/index.js`).
- The app reads PORT from `process.env.PORT` and defaults to `3000`.

4) API examples (useful for tests / patches)
- GET all quizzes: GET /api/quiz -> returns array from `src/data/quiz.js`.
- GET single quiz: GET /api/quiz/:quizId -> returns object or 404 if not found.
- POST create: POST /api/quiz with JSON body { "question": "...", "options": [...], "answer": "...", "keywords": [...] } -> returns 201 and new quiz.
- PUT update: PUT /api/quiz/:quizId same body shape as POST -> returns updated quiz or 404.
- DELETE: DELETE /api/quiz/:quizId -> removes item and returns deleted quiz.

5) Safe modification rules for automated edits
- Preserve CommonJS style. If you change module type, update package.json `type` and adjust imports across files.
- When adding features that require persistence, prefer adding a new data access layer under `src/data` (e.g., `src/data/quizStore.js`) rather than changing the existing `quiz.js` fixture in place — keep the fixture for tests/examples.
- Tests are not present. If adding unit tests, use a standard test runner (e.g. Jest) and add npm scripts. Keep tests isolated from the in-memory fixture (clone data per test).

6) Integration & external deps
- Only declared dependency: `express` (see `package.json`). No DB or external APIs are configured.
- Avoid adding heavy dependencies unless required; this is a learning/demo repo.

7) Small, actionable examples for common edits
- To add a new route, create `src/routes/yourRoute.js`, export an Express router, and `require` + mount it in `src/index.js` (follow the `quiz` pattern).
- To add server-side validation, follow the simple check/return style used in `quiz` handlers and keep the returned shape `{ msg: "..." }`.

8) What not to change without verification
- The app's startup scripts (`npm start`, `npm run dev`) and `process.env.PORT` usage.
- The in-memory fixture shape (`id`, `question`, `options`, `answer`, optional `keywords`) — many route handlers expect this exact shape.

If anything in this file is unclear or you want more precise instructions (for example: testing strategy, preferred code style, or where to add persistence), tell me which area to expand and I will iterate.
