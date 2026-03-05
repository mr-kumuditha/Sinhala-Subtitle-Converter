# SiSub: Sinhala Subtitle Converter

A modern, production-ready web application built with **Next.js 14**, **Tailwind CSS**, **shadcn/ui**, and **Prisma** (with Supabase PostgreSQL) to translate `.srt` subtitle files from English to Sinhala using the robust **Gemini API**.

## Features
- **Accurate Translation:** Fast and precise translations while preserving native `.srt` timestamps and indexing.
- **Modern UI:** Clean, responsive, and easy-to-use interface powered by Tailwind CSS and Radix primitives via `shadcn/ui`.
- **User Authentication:** Supports user accounts and anonymous guest modes for testing.
- **Job History:** Track translation jobs efficiently with Supabase PostgreSQL.

## Technologies
- **Framework:** Next.js 14 (App Router, Server Actions)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase PostgreSQL (via Prisma ORM 7+)
- **Authentication:** NextAuth.js
- **AI Translation:** Google Gemini API (`gemini-1.5-flash`)

## Getting Started Locally

### 1. Pre-requisites
- Node.js 18+
- An active Supabase Database (or any PostgreSQL instance).
- A valid Google Gemini API Key.

### 2. Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Fill out the variables inside `.env`:
- `DATABASE_URL`: Your Supabase connection string for the database.
- `NEXTAUTH_SECRET`: A random secure string for NextAuth session encryption.
- `GEMINI_API_KEY`: Your key from Google AI Studio.

### 3. Database Migration
Run the Prisma migrations to build the tables:
```bash
npx prisma db push
# Or if using migrations:
npx prisma migrate dev
```

### 4. Install Dependencies & Start Server
```bash
npm install
npm run dev
```

The web application should now be accessible at `http://localhost:3000`.

## Deployment to Vercel
1. Push your repository to GitHub.
2. Go to your **Vercel Dashboard**, and Import the repository.
3. In the environment variables section on Vercel, copy the identical variables from your local `.env`. 
4. **Build settings**: Usually Vercel auto-detects Next.js. The build command `npm run build` is sufficient.
5. Hit **Deploy**. 

---
_Note: Because translation relies on the Gemini API, heavy SRT files may hit rate limits dynamically. The internal batching system respects standard usage limits._
