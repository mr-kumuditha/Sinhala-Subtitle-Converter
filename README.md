<p align="center">
  <img src="public/sisub-mark.svg" width="104" alt="SiSub logo" />
</p>

<h1 align="center">SiSub</h1>

<p align="center">
  A premium, AI-powered studio for translating English SRT subtitles into natural Sinhala.
</p>

<p align="center">
  <a href="https://sinhala-subtitle-converter-seven.vercel.app">Live app</a> ·
  <a href="#getting-started">Getting started</a> ·
  <a href="#environment-variables">Configuration</a> ·
  <a href="LICENSE">MIT License</a>
</p>

---

## What SiSub does

SiSub makes subtitle localisation feel like a focused studio workflow: upload an `.srt` file, follow the live conversion progress, and download a Sinhala version that retains the original SRT structure.

It is designed for dialogue, not isolated fragments. The conversion pipeline processes contextual batches so translations can better preserve tone, timing, and common Sri Lankan English usage.

### Highlights

- Preserves subtitle indices, timestamps, line breaks, and supported formatting tags.
- Translates in weighted batches with Gemini and a Langbly fallback path.
- Streams NDJSON progress to the browser while conversion is running.
- Uses a bounded in-memory LRU cache to avoid repeat translations in an active server instance.
- Supports optional authentication, conversion history, PostgreSQL persistence, and S3 archival for signed-in users.
- Includes a polished, responsive dark-mode interface built with Next.js, Tailwind CSS, and Radix UI primitives.

## Architecture

```text
SRT upload
  -> parse and normalise subtitle blocks
  -> de-duplicate and check the LRU cache
  -> create bounded contextual batches
  -> Gemini translation / Langbly fallback
  -> rebuild the SRT file
  -> stream progress and return the download
```

For authenticated users, the original and translated file can also be archived to S3 and a job entry can be stored through Prisma.

## Stack

| Area | Technology |
| --- | --- |
| App | Next.js 14, React 18, TypeScript |
| UI | Tailwind CSS, Radix UI, Lucide |
| Translation | Google Gemini, Langbly fallback |
| Data | PostgreSQL, Prisma |
| Authentication | NextAuth with Credentials, Google, and Email providers |
| Storage | AWS S3-compatible storage |
| Deployment | Vercel |

## Getting started

### Prerequisites

- Node.js 20 or later
- A PostgreSQL database (required by Prisma)
- A Gemini API key for translation

### Install and run

```bash
git clone https://github.com/mr-kumuditha/Sinhala-Subtitle-Converter.git
cd Sinhala-Subtitle-Converter
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Use the included `.env.example` as a starting point, never commit `.env`, and use strong production secrets.

## Environment variables

| Variable | Required | Purpose |
| --- | :---: | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection URL used by Prisma |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection URL for Prisma |
| `NEXTAUTH_SECRET` | Yes | Secret used to sign NextAuth sessions |
| `NEXTAUTH_URL` | Yes | Canonical application URL, for example your Vercel domain |
| `GEMINI_API_KEY` | Yes | Google Gemini API key used for translation |
| `GEMINI_MODEL` | No | Gemini model override; defaults to `gemini-2.5-flash` |
| `LANGLY_API_KEY` | No | Langbly fallback translation API key |
| `AWS_ACCESS_KEY_ID` | For archival | S3 access key |
| `AWS_SECRET_ACCESS_KEY` | For archival | S3 secret access key |
| `AWS_REGION` | For archival | AWS/S3 region; defaults to `us-east-1` |
| `AWS_S3_BUCKET_NAME` | For archival | Bucket used for subtitle archives |
| `AWS_S3_ENDPOINT` | No | Custom S3-compatible endpoint |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | For Google sign-in | Google OAuth credentials |
| `EMAIL_SERVER` / `EMAIL_FROM` | For email sign-in | SMTP connection URL and sender address |

## Deploying to Vercel

The application is deployed at [sinhala-subtitle-converter-seven.vercel.app](https://sinhala-subtitle-converter-seven.vercel.app).

For a new Vercel project, import this repository, use the default Next.js build settings, and add the required production variables from the table above. `NEXTAUTH_URL` must be a complete HTTPS URL for the production domain; a missing or invalid value prevents NextAuth pages from being pre-rendered.

The translation route exports a 60-second maximum duration. Confirm that this matches your Vercel plan and expected subtitle sizes before relying on it for long files.

## Project structure

```text
src/
├── app/                 # App Router pages and API routes
├── components/          # Subtitle studio and UI primitives
├── lib/                 # SRT parsing, translation, auth, S3, Prisma helpers
└── hooks/               # Client-side hooks
prisma/schema.prisma     # PostgreSQL and NextAuth schema
public/sisub-mark.svg    # Project logo
```

## License

SiSub is available under the [MIT License](LICENSE).
