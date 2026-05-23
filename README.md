# Valorant Strategy Board

A Next.js app for sharing Valorant strategy posts with auth, comments, PostgreSQL storage through Prisma, and media uploads through Vercel Blob.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Copy the example env file and fill in local values:

```bash
copy .env.example .env
```

3. Generate Prisma client and run the dev server:

```bash
npm run build
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

Set these in Vercel Project Settings > Environment Variables:

- `DATABASE_URL`: PostgreSQL connection string from Neon.
- `JWT_SECRET`: long random string used to sign login cookies.
- `BLOB_READ_WRITE_TOKEN`: created by Vercel Blob when Blob storage is connected to the project.

Do not commit real `.env` files. They are intentionally ignored by git.

## Production Database Setup With Neon

1. Create a new Neon project.
2. Copy the production PostgreSQL connection string. Use the pooled connection string if Neon recommends it for serverless apps.
3. Add that value to Vercel as `DATABASE_URL`.
4. Temporarily put the same value in your local `.env`.
5. Apply migrations to the new database:

```bash
npm.cmd run db:deploy
```

On macOS/Linux, use:

```bash
npm run db:deploy
```

## Vercel Deployment Checklist

1. Confirm Vercel deploys from GitHub `main`.
2. Add `DATABASE_URL`, `JWT_SECRET`, and `BLOB_READ_WRITE_TOKEN` in Vercel.
3. Connect or create Vercel Blob storage for the project.
4. Run `npm.cmd run db:deploy` against the Neon production database.
5. Redeploy the Vercel project.
6. Test production:
   - Register a new account.
   - Log out and log back in.
   - Upload one image.
   - Open a map/site page and confirm the post appears.
   - Add, edit, and delete a comment.

If production functionality still fails, check Vercel Function Logs for:

- `/api/auth/register`
- `/api/auth/login`
- `/api/posts/upload`
- `/api/comments`

## Scripts

- `npm run dev`: start local development server.
- `npm run build`: generate Prisma client and build Next.js.
- `npm run start`: start the production Next.js server.
- `npm run lint`: run ESLint.
- `npm run db:deploy`: apply Prisma migrations to the database in `DATABASE_URL`.
