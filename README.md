This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database migrations

`npm run migrate` applies pending files in `migrations/` and records them in
`schema_migrations`. A database that was migrated by hand (production) must be
marked once with `npm run migrate -- --baseline` before it can be used there.

## Tests

The tests call a running server and use its database, so point both at a
local Postgres (they refuse a remote one unless `ALLOW_REMOTE_TEST_DB=1`):

```bash
createdb hustlebuddy_test
export DATABASE_URL=postgres://localhost/hustlebuddy_test DATABASE_SSL=disable
npm run migrate && npm run build && npm start   # in one terminal
npm test                                        # in another, same env
```

Resume upload tests need Supabase Storage and run only with `TEST_STORAGE=1`.
CI (`.github/workflows/ci.yml`) runs the type check, migrations and tests on every push.

## Live updates

The dashboard's live updates go through Postgres `LISTEN/NOTIFY`, so they work
across any number of server instances. Each instance with an open dashboard
holds one extra session-level connection. With a Supabase transaction-pooler
URL (port 6543) the session pooler on 5432 is used automatically; for other
setups, set `DATABASE_LISTEN_URL` to a direct or session-mode connection.
