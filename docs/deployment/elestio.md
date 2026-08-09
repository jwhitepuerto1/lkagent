# Deploying ias-v1 to Elestio

This app is a standard containerized Next.js app (`Dockerfile` +
`docker-compose.yml` at the repo root, verified locally: `npm run build`
succeeds, and the resulting standalone server boots under
`NODE_ENV=production` and successfully queries the real Elestio Postgres
database - see the fix in `lib/prisma.js` if that connection ever fails
again after a dependency upgrade).

## Steps

1. In the Elestio dashboard, **Deploy a new service** → choose the
   **Docker Compose** service type (not one of the pre-built software
   templates - this is a custom app).
2. Point it at the `jwhitepuerto1/lkagent` GitHub repo, `main` branch (or
   `feat/identity-kernel` if `main` isn't up to date yet - check which
   branch actually has the latest commits before deploying).
3. Elestio will detect `docker-compose.yml` at the repo root and build from
   the `Dockerfile` it references.
4. Set the container port to **3000** (matches `EXPOSE 3000` in the
   Dockerfile and the `ports` mapping in `docker-compose.yml`).
5. In Elestio's **Environment Variables** panel for this service, set:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Same value as your local `.env.local` |
   | `AUTH_SECRET` | Same value as local, or rotate to a new 32+ char secret |
   | `AUTH_PASSWORD` | The admin login password for this app |
   | `ANTHROPIC_API_KEY` | Your Anthropic key |
   | `UNIPILE_API_KEY` | Your Unipile key |
   | `UNIPILE_DSN` | e.g. `api33.unipile.com:16348` |
   | `UNIPILE_ACCOUNT_ID` | The connected LinkedIn account's id |
   | `LINKEDIN_ENGAGEMENT_INGEST_SECRET` | A new random string - must match what you set in n8n |

   **Do not reuse `AUTH_SECRET`/`AUTH_PASSWORD` from a throwaway dev value**
   if the current `.env.local` ones were only ever meant for local testing.

6. Deploy. Elestio will give you a public HTTPS URL - that's `IAS_BASE_URL`
   for the n8n workflow (`n8n/linkedin-engagement-daily.json`).
7. In your n8n instance (also on Elestio), set `IAS_BASE_URL` and
   `LINKEDIN_ENGAGEMENT_INGEST_SECRET` as environment variables, import
   `n8n/linkedin-engagement-daily.json`, and activate the workflow.
8. Sanity check once live: `curl https://<your-elestio-url>/api/auth/me`
   should return `401 Unauthorized` (proves the app booted and the auth
   gate works) rather than a connection error or 500.

## Why the SSL fix in lib/prisma.js mattered

Elestio's Postgres presents a self-signed certificate. Before this
deployment, `lib/prisma.js` used strict certificate verification
(`rejectUnauthorized: true`) whenever `NODE_ENV === "production"`, which
would have rejected that self-signed cert and made every database call
fail immediately on a production deploy - the app would have booted (it
doesn't touch the DB at startup) but every page/API route that queries
Postgres would 500. This was changed to relax verification in both dev and
production, matching the `sslmode=no-verify` already present in
`DATABASE_URL` for this specific database.
