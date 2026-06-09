# Barberia App

## Stack
- React 19 + Vite (no TypeScript)
- React Router 7 (SPA routing)
- Supabase for auth (`@supabase/supabase-js`)
- ESLint flat config (no Prettier)

## Commands
```sh
npm run dev      # dev server with HMR
npm run build    # production build
npm run lint     # ESLint (ignores dist/)
npm run preview  # preview production build
```

## Env Vars (required before dev server starts)
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```
Set these in a `.env` file or system environment. The `.env` in `src/` is empty.

## Routes
- `/` — Booking page (public)
- `/login` — Staff login (email + password)
- `/dashboard` — Protected route (requires auth via Supabase session)

## Auth Flow
`AuthContext` (`src/contexts/AuthContext.jsx`) wraps the app. Protected routes use a `ProtectedRoute` component that redirects unauthenticated users to `/login`. Auth state syncs with `supabase.auth.onAuthStateChange`.

## No Test Suite
There are no tests. Do not add test commands to `package.json` scripts without confirming with the user.