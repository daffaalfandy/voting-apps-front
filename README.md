# Voting Application web

Web client for the voting application: a one-screen ballot for voters and an election console for administrators.

React 19 (JavaScript and JSX), Vite, Tailwind CSS 4, React Router and TanStack Query. It talks to the API in [`voting-apps-back`](../voting-apps-back).

## Run it

The only requirement is Docker with Compose v2.

**Together with the API (recommended).** Clone this repository next to `voting-apps-back`, then from `voting-apps-back`:

```bash
docker compose up --build
```

Voters open http://localhost:3000. Administrators open http://localhost:3000/admin/login. The seeded accounts and vote codes are listed in the backend README.

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
| `/vote` | voters | Pick a name or write one in, confirm, then see what was recorded. Typing a name that is already listed says so before submitting. Until the system is locked it shows "Voting has not started" instead, and the ballot appears on its own once voting opens. |
| `/admin/results` | administrators | Votes cast, turnout, standings, and the voter participation list (who voted and when, never how). Refreshes every 10 seconds. Also holds "Reset the election". |
| `/admin/candidates` | administrators | Add names. Remove names that have no votes. |
| `/admin/users` | administrators | Search, filter by voted / not voted, add, edit, suspend, reset a vote, delete. Adding a voter shows their vote code once. Edit can issue a new one if it is lost. |

The lock button in the console is the election switch. Unlocked means preparing: users and candidates can change and voting has not started. Locked means the election is running: voters can vote, and controls that would change users or candidates are disabled, with a banner saying why. Resetting the election (every vote and write-in name deleted, voters and listed names kept) only works while unlocked, and asks you to type RESET to confirm.

## Design notes

- Colours and the Plus Jakarta Sans typeface come from the original mockup: a slate-950 header, slate surfaces, indigo for actions and selection, and status colours that mean the same thing everywhere. Emerald marks leading, voted and active. Amber marks write-ins and the lock. Rose marks errors, suspension and deletion. They are CSS variables in `src/index.css`. The app is light only. Every text colour pair meets WCAG AA.
- The radio buttons are drawn as the oval you fill in on a paper ballot. The same filled oval sits in the wordmark and on the voter's receipt.
- Dialogs use the native `<dialog>` element, so Escape, focus trapping and returning focus work without extra code. Radio groups are native inputs, so arrow keys work.
- Every data view has a loading state, an error state with a retry button, and an empty state that says what to do next.
- Interactive controls are at least 44px tall and show a visible focus ring.
- The session token is kept in `localStorage` to survive reloads. That keeps the app simple, at the cost of being readable by any script that runs on the page. An httpOnly cookie would be the next step for a public deployment.

## How the code works

### Startup

`main.jsx` creates one TanStack Query client and wraps the app in three providers, outermost first:

1. `QueryClientProvider`: the cache for everything fetched from the API.
2. `AuthProvider` (`auth/AuthContext.jsx`): the signed-in user, and the sign-in and sign-out actions.
3. `ToastProvider`: short confirmations such as "Vote recorded".

If a token was saved on an earlier visit, `AuthProvider` asks `GET /auth/me` who it belongs to, and the app shows "Restoring your session…" until the answer arrives. Only then does the router render, so reloading `/admin/users` stays on that page instead of bouncing through the sign-in screen.

Failed queries are retried up to twice, except 4xx responses: a 403 or a 404 will not change on a second try.

### Data flow

```
page component
  → useQuery / useMutation       TanStack Query: cache, loading and error state
  → api(path, options)           src/api/client.js: token, JSON, errors
  → fetch('/api/...')
  → Vite dev proxy or nginx      same origin as the page
  → voting-apps-back
```

- **Reading.** A page asks for data with `useQuery` and a key. The answer is cached under that key, and every component that uses the same key shares it. `QueryState` turns a query into a loading line, an error box with a retry button, or the content.
- **Writing.** Forms and buttons call `useMutation`. On success the mutation either writes the server's answer straight into the cache (`setQueryData`) or marks related keys as stale (`invalidateQueries`), and any screen showing them fetches again. That is how adding a user also updates turnout on the results tab, without the two pages knowing about each other.
- **Staying current.** Results and the participation list refetch every 10 seconds. The voter's lock state refetches every 15 seconds, so the ballot appears on its own once the administrator starts the election. Typing in the user search waits 250 ms before it changes the query, and the previous list stays on screen while the new one loads.
- **When the server disagrees.** If a vote comes back 409 (already voted) or 423 (voting not open), the ballot refetches the data involved instead of guessing, and the screen moves to whatever the server says is true.

| Query key | Endpoint | Used by | Refreshed |
|---|---|---|---|
| `['settings']` | `GET /settings` | ballot, admin console | Every 15 s on the ballot. Set directly after locking or unlocking. |
| `['myVote']` | `GET /votes/me` | ballot | Set directly after voting. Refetched on 409. |
| `['candidates']` | `GET /candidates` | ballot, candidates tab | After a vote, a candidate change or a reset. |
| `['results']` | `GET /results` | results tab | Every 10 s. After any user or candidate change, or a reset. |
| `['participation']` | `GET /participation` | results tab | Every 10 s. After user changes, a reset, or Refresh. |
| `['users', search, filter]` | `GET /users` | users tab | After any user change or a reset. |

### Session

- `tokenStore` in `api/client.js` keeps the token in `localStorage`, and `api()` sends it as `Authorization: Bearer ...` with every request.
- Signing in posts to `/auth/login` or `/auth/admin/login`, saves the token and puts the returned user into `AuthProvider`.
- If a request comes back 401 while a token is set, the token has expired or the account is gone. `api()` calls the handler that `AuthProvider` registered, which clears the token, the user and the whole query cache, and the route guards send the person to sign in.
- Signing out does the same, so the next person on a shared computer starts with an empty cache.

### Routing and access

`router.jsx` lists every route. They all render inside `AppShell` (header, skip link, main area). `RequireRole` wraps the voter and administrator areas: without a user it redirects to the right sign-in page and remembers where the person was going. With the wrong role it redirects to that user's own start page. These guards only decide what to show. The API checks every request on its own.

The administrator tabs are nested under `AdminLayout`, which loads the lock state once, shows the lock switch and its banner, and hands `locked` to the tabs through the router's outlet context (`useAdminContext()`). A tab disables every control that would change users or candidates unless `locked` is exactly `false`, so while the state is loading, or failed to load, nothing can be edited.

### Errors

`api()` turns any failed response into an `ApiError` with the HTTP status and the most useful message: the first validation detail if there is one, otherwise the API's own message. A network failure becomes status 0 with "Could not reach the server". Queries show the message through `QueryState`. Mutations show it in an `ErrorAlert` next to the form or button that caused it.

## Why it is structured this way

- **The server is the source of truth.** There is no client-side store of users, votes or candidates. The query cache is the only copy, keyed by request, and every change goes to the API first and then refreshes from it. The client never adds up totals or decides on its own whether someone may vote.
- **One door to the API.** Every request goes through `api()` in `src/api/client.js`, so the base path, the token, JSON handling, error messages and signing out on 401 live in one small file instead of in every page.
- **Context only for what is truly global.** React context holds the session and the toast, the two things every screen needs. Everything else is either server data, which belongs in the query cache, or form state, which belongs in the component that owns the form.
- **Pages own their data.** Each page declares its queries and mutations next to the markup that uses them, so a screen reads top to bottom: what it loads, what it changes, what it renders. Pages that affect each other share cache keys instead of calling each other.
- **Components only render.** Nothing in `components/` fetches data. Buttons, fields, the dialog, the toast and `QueryState` take props and render, so any page can use them without pulling in data it does not need.
- **One origin.** The app only calls relative `/api` paths. In development Vite proxies them to port 4000. In Docker nginx proxies them to `API_UPSTREAM`. The built files contain no API address, the API needs no CORS setup, and the same image works against any backend.
- **A static build.** `npm run build` produces plain HTML, CSS and JavaScript. nginx caches the hashed files under `/assets` for a year, always revalidates `index.html` so a new release shows up on the next load, and answers any unknown path with `index.html` so deep links and reloads work.

## Layout

```
src/
  api/          fetch wrapper, token store, API errors
  auth/         session context, role guard
  components/   app shell, dialog, toast, loading/error wrapper, form controls
  pages/        login, ballot, not found
  pages/admin/  console layout, results, candidates, users
  lib/          formatting, debounce
nginx/          config template for the Docker image
```
