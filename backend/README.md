# BrightPath Backend

Express + SQLite + JWT auth + server-side AI tutor endpoint.

## Structure
```
backend/
├── server.js              # entry point, mounts routes, serves frontend
├── db/
│   ├── schema.sql          # table definitions
│   └── database.js         # opens brightpath.db, runs schema on boot
├── middleware/
│   └── auth.js              # JWT verification + role guard
└── routes/
    ├── auth.js               # signup / login (student + parent)
    ├── progress.js           # save/read chapter & level progress
    ├── parent.js             # parent dashboard: view linked children's real data
    └── tutor.js               # "Ask My Doubts" — calls Anthropic API server-side
```

## Setup
```bash
npm install
cp .env.example .env   # fill in JWT_SECRET and ANTHROPIC_API_KEY
npm start
```
Server runs on `http://localhost:3000` and also serves `../frontend` (your
existing `frontend/` build) as static files, so the whole app runs from one
process — no CORS issues, no separate frontend server needed.

## Auth flow
- `POST /api/auth/signup` — `{ name, email, password, role, class?, learningStyle?, parentEmail? }`
  - `role: 'student'` requires `class` (6/7/8). `learningStyle` is `'dyslexia' | 'standard'`.
  - Pass `parentEmail` to link a student to an existing parent account.
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- All other routes require `Authorization: Bearer <token>`.

## Key design decision: strict NCERT tutor prompt
`routes/tutor.js` builds the system prompt server-side, per-request, using the
logged-in student's actual class and learning style from the database (never
trusted from the client). It hard-restricts Mia to the student's current
subject and Class 6-8 NCERT scope, and refuses off-topic questions — this
enforcement can't be bypassed from the frontend since the prompt never
leaves the server.

## Endpoints
| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/signup | — | Create student or parent account |
| POST | /api/auth/login | — | Log in, get JWT |
| POST | /api/progress/update | student | Upsert level/xp/score for a chapter |
| GET  | /api/progress/me | student | Get all of own progress |
| POST | /api/progress/placement-quiz | student | Save onboarding placement result |
| GET  | /api/parent/children | parent | List linked children |
| GET  | /api/parent/children/:id/progress | parent | Full progress for one child |
| POST | /api/tutor/ask | student | Ask Mia — Anthropic API call, NCERT-scoped |
| GET  | /api/tutor/history | student | Past tutor Q&A for this student |

## Verified
- Every route file passes `node --check`.
- Live smoke test run: parent signup → student signup (linked via
  `parentEmail`) → login → progress update → parent dashboard correctly
  returns the linked child's real progress → unauthenticated request
  correctly rejected with 401.
