# Changelog

Level 2 headers are homologous with commits for consistency

---

## Refactor

### docker-compose.yml

- Rewritten for compose V2
- Removed unnecessary exposed ports except for caddy.
Good Practice: one entry-point in form of a reverse proxy
- Removed bind mounted volumes in favor of named volumes.
Named modules are handled by docker-compose automatically.
Bind mounted volumes act as 2-way sync directories between
host machine and container. Not needed for a database or
a reverse proxy configuration file.
- Add database container config and admin user creation.
Databases don't need their own custom dockerfile (mostly).
Migrations moved under nextApp management.
- Add commented out ports for the database
Needed to generate migrations. ~Maybe we find a better solution for it.~
Prisma requires a DB connection to generate the migrations so the workflow is:
`docker compose up database -d`
`DATABASE_URL=<...> npx prisma migrate dev --name <migration_name>`
Then docker will run `prisma migrate deploy` to apply the current migrations

### nextApp/ (former frontend)

- Heavy refactor to house both FE and BE, using the new next
App Router.
Everything in *src/* except for prisma migrations and public
assets (icons, images, etc)
- *src/app/**- Every directory at this level and deeper is a route.
They map directly to the URL.
- *src/app/api/** - Every directory at this level and deeper is an
API route.
Pages are defined by a *page.tsx* file and routes by a *route.tsx* file.

### requireAuth

\```TS
type AuthSuccess = { user: User;         response: null;         }
type AuthFailure = { user: null;         response: NextResponse; }
\```

- Refactored return type to a discriminated union
  `AuthSuccess | AuthFailure` for proper TypeScript narrowing.
- All route handlers updated to use the pattern:
  `const auth = await requireAuth(req);`
  `if (auth.response) return auth.response;`
  `const authUser = auth.user;`

### .env

- One singular .env file, at the root of the project.
It is read by default by docker compose
(if named *.env* otherwise pass like: `docker compose --env-file .env.dev up` )
and we can inject the vars into the containers that need them.
(see docker-compose.yml)

### Makefile

- Removed `setup` target (obsolete)
- Removed references to old bind-mounted volume locations
- Faster rebuilds: `dev` uses `docker compose up --build` instead of
  separate `docker compose build` then `docker compose up -d`,
allowing Docker to use layer cache more effectively.

### adminrole.sh - Removed

- Replaced with Prisma seeding which creates the admin user at runtime
if it doesn't exist. (see prisma/seed.ts)

### caddyfile

- Removed redundant routing, 99% of routes go to nextApp anyway
We can add back the other static content route, but for now they
were unnecessarily complicating the config

### backend/ - Removed

### database/ - Removed

### presetup.sh - Removed
