# Campus Connect

Campus Connect is a responsive campus information and student-support workspace. It includes a React/Vite client and an Express/MongoDB API, with role-based access for students, faculty, and administrators.

> **Demo data notice:** The seed script creates fictional campus policies, people, events, and tickets for local development. They are examples only and are not official campus information.

## Features

- Student registration, JWT sign-in, profile editing, and password changes.
- Student, faculty, and administrator roles enforced by backend middleware.
- Published campus knowledge search and faculty/admin content management.
- Announcements with priorities and audience targeting.
- Campus events with capacity checks and duplicate-safe registration/cancellation.
- Support tickets with ownership checks, staff replies/internal notes, status updates, and validated attachments.
- Persistent chat history and an AI assistant grounded in published knowledge articles.
- Student dashboard and MongoDB aggregation-backed administrator analytics.
- Responsive landing page and application shell.

## Technology

- **Frontend:** React, Vite, React Router, Tailwind CSS, Axios, Lucide, Framer Motion, Recharts, React Hot Toast.
- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT, bcrypt, Multer, Express Validator, Helmet, rate limiting, OpenAI SDK.

## Project structure

```text
backend/
  middleware/     Authentication and role authorization
  models/         Mongoose schemas and indexes
  routes/         REST API routes
  services/       Knowledge-grounded AI service
  uploads/        Local ticket attachments
  server.js       API entry point
  seed.js         Fictional local demo data
frontend/
  src/components/ Shared UI and application layout
  src/context/    Authentication state
  src/pages/      Public and authenticated pages
  src/services/   API client
```

## Prerequisites

- Node.js 20 or newer and npm.
- MongoDB Community Server or a MongoDB-compatible URI.
- An OpenAI API key is optional. The assistant uses published knowledge directly when no key is configured.

## Setup

From the project root:

1. Install root scripts and backend dependencies:

   ```powershell
   npm install
   npm install --prefix backend
   ```

2. Install frontend dependencies:

   ```powershell
   npm install --prefix frontend
   ```

3. Copy environment templates and edit the backend values:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   Copy-Item frontend\.env.example frontend\.env
   ```

   Set a long, unique `JWT_SECRET` and a reachable `MONGODB_URI` in `backend\.env`. To use OpenAI, set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. The key stays on the server and must never be added to the frontend environment.

4. Seed fictional local demo data:

   ```powershell
   npm run seed
   ```

5. Start both applications:

   ```powershell
   npm run dev
   ```

   Or use separate terminals with `npm run dev:backend` and `npm run dev:frontend`.

- Frontend: <http://localhost:5173>
- API health: <http://localhost:5000/api/health>

Set `CLIENT_URL` to the frontend origin if it differs from `http://localhost:5173`. Set `VITE_API_URL` if the API is hosted at a different URL.

## Local demo accounts

The seed script creates:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@campus.demo` | `CampusDemo2026!` |
| Faculty | `faculty@campus.demo` | `CampusDemo2026!` |
| Student | `student@campus.demo` | `CampusDemo2026!` |

These are for local development only. Do not deploy the demo accounts or use the sample password in a real environment. Override the seed password with `DEMO_PASSWORD` before running the seed script.

## API overview

All routes are under `/api`. Except for registration, login, and health check, routes require a bearer JWT in the `Authorization` header.

| Area | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `PUT /auth/profile`, `PUT /auth/password` |
| Users | `GET /users`, `PUT /users/:id`, `DELETE /users/:id` (admin) |
| Knowledge | `GET /knowledge`, `GET /knowledge/:id`, `POST /knowledge`, `PUT /knowledge/:id`, `DELETE /knowledge/:id` |
| Announcements | `GET /announcements`, `POST /announcements`, `PUT /announcements/:id`, `DELETE /announcements/:id` |
| Events | `GET /events`, `POST /events`, `PUT /events/:id`, `DELETE /events/:id`, `POST /events/:id/register`, `DELETE /events/:id/register` |
| Support | `GET /tickets`, `POST /tickets`, `GET /tickets/:id`, `PUT /tickets/:id`, `POST /tickets/:id/replies`, `POST /tickets/upload` |
| AI chat | `POST /chat`, `GET /chat/conversations`, `POST /chat/conversations`, `GET /chat/conversations/:id`, `DELETE /chat/conversations/:id` |
| Dashboard | `GET /dashboard/student`, `GET /dashboard/admin` |

List routes accept `page` and `limit` parameters and return `{ data, pagination }`. Authentication and resource mutations return JSON with a clear `message` on errors.

## AI assistant behavior

The server searches published knowledge articles and sends matching article content to OpenAI when configured. Without an API key, it returns the matching published article content. If no article matches, it says the information could not be verified and directs the student to campus support. The assistant is not intended to invent official policies or deadlines.

## Troubleshooting

- **MongoDB connection fails:** Confirm the MongoDB service is running and `MONGODB_URI` is correct.
- **JWT configuration error:** Set `JWT_SECRET` in `backend\.env`; the API intentionally refuses to start without it.
- **Frontend cannot reach API:** Check that the backend is listening on port 5000 and that `VITE_API_URL` and `CLIENT_URL` match your local setup.
- **AI unavailable:** The app still answers from matching published knowledge when no OpenAI key is configured. Check backend logs for provider errors.
- **Seed accounts already exist:** Seeding is idempotent for demo users and content. Use a fresh local database if you want to reset sample data.

## Production considerations

Configure strong secrets, TLS, a production MongoDB deployment, restrictive CORS origins, monitored backups, and a private persistent upload store before deployment. Review campus-specific policies and replace all fictional seed content before making the assistant available to students.
