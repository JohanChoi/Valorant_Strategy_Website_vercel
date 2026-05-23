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

<<<<<<< HEAD
Set these on the production server:

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: long random string used to sign login cookies.
- `UPLOAD_DIR`: persistent directory where uploaded images/videos are stored.
- `PORT`: optional port for `next start`; defaults to `3000` if your process manager does not set it.

Do not commit real `.env` files. They are intentionally ignored by git.

## Bluehost VPS Deployment

This app requires a Node.js runtime because it uses Next.js Route Handlers, cookies, Prisma, and server-side media uploads. Use a Bluehost VPS or another Node-capable Bluehost product, not a static-only shared hosting setup.

Required production environment variables:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="replace-with-a-long-random-secret"
UPLOAD_DIR="/var/www/valorant-strategy-board/uploads"
PORT="3000"
```

`UPLOAD_DIR` must be a persistent directory writable by the Node.js process. If it is omitted in production, uploads default to `/var/www/valorant-strategy-board/uploads`. In development, uploads default to `public/uploads`.

Deployment command sequence:

```bash
npm ci
npm run db:deploy
npm run build
npm run start
```

Put a reverse proxy such as Nginx or Apache in front of the app and proxy traffic to the configured `PORT`.

## Production Database Setup

1. Create a PostgreSQL database.
2. Copy the production PostgreSQL connection string.
3. Add that value on the server as `DATABASE_URL`.
4. Temporarily put the same value in your local `.env` only if you need to run migrations from your own machine.
5. Apply migrations to the production database:
=======
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
>>>>>>> f9d3407 (Harden deployment config and auth navbar)

```bash
npm.cmd run db:deploy
```

On macOS/Linux, use:

```bash
npm run db:deploy
```

<<<<<<< HEAD
## Deployment Checklist

1. Confirm Bluehost deploys from GitHub `main`.
2. Add `DATABASE_URL`, `JWT_SECRET`, `UPLOAD_DIR`, and `PORT` on the Bluehost server.
3. Create the `UPLOAD_DIR` folder and make it writable by the Node.js process.
4. Run `npm run db:deploy` against the production PostgreSQL database.
5. Build and start the Next.js app.
=======
## Vercel Deployment Checklist

1. Confirm Vercel deploys from GitHub `main`.
2. Add `DATABASE_URL`, `JWT_SECRET`, and `BLOB_READ_WRITE_TOKEN` in Vercel.
3. Connect or create Vercel Blob storage for the project.
4. Run `npm.cmd run db:deploy` against the Neon production database.
5. Redeploy the Vercel project.
>>>>>>> f9d3407 (Harden deployment config and auth navbar)
6. Test production:
   - Register a new account.
   - Log out and log back in.
   - Upload one image.
   - Open a map/site page and confirm the post appears.
   - Add, edit, and delete a comment.

<<<<<<< HEAD
If production functionality fails, check the Node.js app logs for:
=======
If production functionality still fails, check Vercel Function Logs for:
>>>>>>> f9d3407 (Harden deployment config and auth navbar)

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
