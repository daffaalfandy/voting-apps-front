# Voting Application web

Web client for the voting application: a one-screen ballot for voters and an election console for administrators.

React 19, Vite, TypeScript, Tailwind CSS 4, React Router and TanStack Query. It talks to the API in [`voting-apps-back`](../voting-apps-back).

## Run it

The only requirement is Docker with Compose v2.

**Together with the API (recommended).** Clone this repository next to `voting-apps-back`, then from `voting-apps-back`:

```bash
docker compose up --build
```

Voters open http://localhost:3000; administrators open http://localhost:3000/admin/login. The seeded accounts and vote codes are listed in the backend README.

**On its own**, pointing at an API that is already running:

```bash
docker build -t voting-app-web .
docker run --rm -p 3000:80 -e API_UPSTREAM=http://host.docker.internal:4000 voting-app-web
```

The image serves the built app with nginx and forwards `/api` to `API_UPSTREAM`, so the browser only ever talks to one origin and the API needs no CORS setup.

**With hot reload** (needs Node 22.12+ and the API on port 4000):

```bash
npm install
npm run dev    # http://localhost:5173, /api is proxied to http://localhost:4000
```

## Screens

| Path | Who | What it is for |
|---|---|---|
| `/login` | voters | Email and vote code. The code is not case-sensitive and the dash is optional. |
| `/admin/login` | administrators | Email and password, on a page of its own. |
| `/vote` | voters | Pick a name or write one in, confirm, then see what was recorded. Typing a name that is already listed says so before submitting. |
| `/admin/results` | administrators | Votes cast, turnout, standings, and the voter participation list (who voted and when, never how). Refreshes every 10 seconds. |
| `/admin/candidates` | administrators | Add names; remove names that have no votes. |
| `/admin/users` | administrators | Search, filter by voted / not voted, add, edit, suspend, reset a vote, delete. Adding a voter shows their vote code once; Edit can issue a new one if it is lost. |

The lock button in the console freezes users and candidates. Controls that would change them are disabled and a banner explains why; voting keeps working.

## Design notes

- Colours and the Plus Jakarta Sans typeface come from the original mockup: a slate-950 header, slate surfaces, indigo for actions and selection, and status colours that mean the same thing everywhere (emerald for leading, voted and active; amber for write-ins and the lock; rose for errors, suspension and deletion). They are CSS variables in `src/index.css`. The app is light only. Every text colour pair meets WCAG AA.
- The radio buttons are drawn as the oval you fill in on a paper ballot. The same filled oval sits in the wordmark and on the voter's receipt.
- Dialogs use the native `<dialog>` element, so Escape, focus trapping and returning focus work without extra code. Radio groups are native inputs, so arrow keys work.
- Every data view has a loading state, an error state with a retry button, and an empty state that says what to do next.
- Interactive controls are at least 44px tall and show a visible focus ring.
- The session token is kept in `localStorage` to survive reloads. That keeps the app simple, at the cost of being readable by any script that runs on the page; an httpOnly cookie would be the next step for a public deployment.

## Layout

```
src/
  api/          fetch wrapper and response types
  auth/         session context, role guard
  components/   app shell, dialog, toast, loading/error wrapper, form controls
  pages/        login, ballot, not found
  pages/admin/  console layout, results, candidates, users
  lib/          formatting, debounce
nginx/          config template for the Docker image
```
