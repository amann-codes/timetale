# TimeTail (timetale) — Project Description

## Overview

**TimeTail** is a personal task and schedule management web app. Users sign in (currently via Google), define **flairs** (labeled task categories with name, description, and color), then add **tasks** using natural language or by picking flairs. An AI backend (Google Gemini) turns those inputs into a structured, time-ordered schedule and merges new tasks with existing ones without time conflicts. The UI shows a timeline of tasks and lets users manage flairs and add tasks from a resizable two-panel layout.

**Product name:** TimeTail (metadata and auth page use “TimeTail”; repo/folder is `timetale`.)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS 4, Radix UI (Avatar, Dialog, Dropdown, Label, Select, Separator, Slot, Tabs), shadcn-style components (Button, Card, Form, Input, etc.), Lucide icons |
| **State / Data** | TanStack React Query 5 (client), Server Actions (mutations & reads) |
| **Auth** | NextAuth v5 (Auth.js) with JWT strategy, Prisma adapter, Google OAuth only in main flow |
| **Database** | MongoDB via Prisma 6 (Prisma Client; optional Prisma Accelerate) |
| **AI** | Google Generative AI (Gemini), `@google/generative-ai`, configured model via `GEMINI_MODEL` (e.g. `gemini-2.5-flash`) |
| **Forms / Validation** | React Hook Form, Zod 4, `@hookform/resolvers` |
| **Other** | `next-themes`, `sonner` (toasts), `react-resizable-panels`, `bcryptjs`, `nodemailer` (present in deps; email flow not clearly used in current auth) |

---

## Repository and App Structure

- **App router:** `src/app/` — root layout, home page, auth page, global CSS, API route for Auth.js.
- **Features:** `src/components/pages/` — auth, schedule (main app), layout (Provider, UserButton).
- **UI primitives:** `src/components/ui/` — shared components (e.g. Button, Card, Form, Input, Dialog, Badge, Resizable panels).
- **Logic:** `src/lib/` — auth config, DB client, Gemini schedule generation, types, routes constants, utils, and server actions (schedule, flairs, user).

Notable file naming: main schedule page component is `SchdulePage.tsx` (typo for “Schedule”).

---

## Data Model (Prisma + MongoDB)

- **User** — id, name, email, optional password, emailVerified, image; relation to `Account[]`.
- **Account** — OAuth accounts (provider, providerAccountId, tokens, etc.) linked to User; used by NextAuth Prisma adapter.
- **Schedule** — one per user (`userId` unique); holds an array of embedded **ScheduleType** items (title, duration, dateTime, optional flairId). Stored as a single document per user.
- **Flair** — one document per user (`userId` unique in schema); name, description, color; used to tag and categorize tasks.

So: one Schedule doc per user (with an array of schedule items). **Flair:** the Prisma schema currently has `userId` as `@unique` on Flair, which would allow only one Flair document per user; the UI and actions (create, list, update) assume multiple flairs per user, so you may need to remove `@unique` from `Flair.userId` to support multiple flairs per user.

---

## Authentication

- **Provider:** Google OAuth only in the main auth UI (`/auth`).
- **Config:** `src/lib/auth/auth.config.ts` — Prisma adapter, Google provider, JWT strategy, custom callbacks to put `userId` on JWT and session, custom sign-in page `/auth`.
- **Entry:** `src/lib/auth/auth.ts` re-exports `handlers`, `signIn`, `signOut`, `auth` from NextAuth(authOptions).
- **API:** `src/app/api/auth/[...nextauth]/route.ts` exports GET/POST from Auth.js handlers.
- **Session:** Wrapped in `SessionProvider` in `Provider.tsx`; `auth()` used in server actions to get session and `userId`.
- **Env:** `AUTH_URL` must match the app origin (e.g. `http://localhost:3000` locally or `https://timetail.vercel.app` in production); `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` for Auth.js/Google.

Credential-based sign-up/sign-in components exist (`Signup.tsx`, `Signin.tsx`, `createUser` with bcrypt) but the main `/auth` page only offers “Continue with Google.”

---

## Core User Flows

1. **Sign in** — User visits `/auth`, clicks “Continue with Google”, completes OAuth, then is redirected to `/`.
2. **View schedule** — Home page shows “Your Schedule” and a timeline of the current user’s schedule (from `getSchedule` server action). If none, shows “No schedule for today, create one!”
3. **Create flairs** — In the right panel, user can create flairs (name, description, color) via `FlairCreator`; stored with `createFlair` and listed in `FlairList` with edit (dialog) and `patchFlair`.
4. **Add tasks** — User enters a free-text description and/or selects flairs in `TaskInput`, then submits. `createTask` server action:
   - Loads or creates the user’s Schedule document.
   - Calls `generateSchedule(description, flairIds, existingSchedule?)` (Gemini).
   - Saves or updates the schedule in MongoDB.
5. **Timeline** — `ScheduleTimeline` renders each schedule item (title, date/time, duration, optional flair badge). `FlairBadge` fetches flair by id (e.g. via `getFlair`) to show name/color.
6. **Sign out** — User button in the header opens a dropdown with “Log out” calling `signOut({ callbackUrl: '/' })`.

---

## AI / Schedule Generation (Gemini)

- **File:** `src/lib/gemini/generateSchedule.ts`.
- **Inputs:** Natural language `description`, optional `flairIds`, optional `currentSchedule` (for merge).
- **Behavior:**
  - Resolves flair details for `flairIds` via `getFlair` and can create tasks from flair descriptions or associate tasks with flairs.
  - Builds a prompt that includes: existing schedule (if any) with strict “no time overlap” and “merge into one chronological array,” current date context, required task shape (title, dateTime ISO, duration, flairId).
  - Uses Gemini with JSON schema output (array of objects: title, dateTime, duration, flairId).
  - Returns parsed schedule array or an error object `{ error: string }`.
- **Env:** `GEMINI_API_KEY`, `GEMINI_MODEL` (e.g. `gemini-2.5-flash`).

---

## Server Actions (Summary)

- **Schedule:** `getSchedule()` — returns current user’s schedule array; `createTask({ description, flairIds })` — generates via Gemini and upserts user’s Schedule.
- **Flairs:** `getUserFlairs()` — list; `getFlair({ flairId })` — one by id; `createFlair({ name, description, color })`; `patchFlair({ id, name, description, color })`.
- **User:** `createUser({ name, email, password })` — credential sign-up (used by Signup flow if wired).

All relevant actions use `auth()` and enforce a signed-in user (throw if no `userId`).

---

## Routing and UI Layout

- **Public:** `/` (home/schedule; content gated by session in components/actions), `/auth` (sign-in page).
- **Route constants:** `src/lib/routes.ts` — `publicRoutes`, `authRoutes`, `authPrefix`, `DEFAULT_LOGIN_REDIRECT` (e.g. for future middleware).
- **Layout:** Root layout applies fonts (Geist Mono, Funnel Display), global CSS, `QueryClientProvider`, Sonner toaster, and `Provider` (SessionProvider). Main page renders `SchdulePage`.
- **Schedule page layout:** Resizable horizontal panels: left (~65%) — “Your Schedule” + timeline; right (~35%) — “Task Scheduler” header, `UserButton`, `TaskInput`, `FlairList`, `FlairCreator`.

---

## Environment Variables

- **Database:** `DATABASE_URL` — MongoDB connection string.
- **Auth:** `AUTH_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`.
- **Gemini:** `GEMINI_API_KEY`, `GEMINI_MODEL`.

`.env` is git-ignored; for production (e.g. Vercel) these must be set in the host. `AUTH_URL` must match the deployed (or local) origin to avoid redirect/session issues.

---

## Styling and Theming

- **Tailwind 4** with `@theme` in `globals.css` (semantic tokens: background, foreground, primary, card, muted, etc.) and `tw-animate-css`.
- **Dark variant:** `@custom-variant dark (&:is(.dark *))` for future dark mode.
- **Design:** Light gray background (`bg-gray-50`), cards and borders, accent on primary/foreground; auth page uses gradient text and blur orbs.

---

## Deployment and Scripts

- **Scripts:** `dev` (Next.js dev), `build`, `start`, `lint`.
- **Deploy target:** Vercel (implied by Auth.js redirect URLs like `timetail.vercel.app` and README).

---

## Summary

TimeTail is a Next.js 16 App Router app that uses NextAuth (Google), MongoDB (Prisma), and Gemini to let users manage labeled “flairs” and generate a single, conflict-free schedule from natural language and flair choices. The client is React 19 with TanStack Query and server actions; the main surface is a resizable schedule view plus task and flair management in one page.
