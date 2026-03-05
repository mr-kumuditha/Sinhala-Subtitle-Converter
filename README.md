# SiSub: Sinhala Subtitle Converter

A production-ready web application that converts subtitle files (.srt) to Sinhala (සිංහල) using Google Gemini AI — with timestamps preserved.

![SiSub Screenshot](https://github.com/user-attachments/assets/839b8452-cb51-4274-823a-08cebf7a1429)

## Features

- 📁 **Upload SRT files** via drag-and-drop or file picker
- 🔍 **Client & server validation** — file type, size (max 5 MB), and SRT structure
- 🌐 **Source language selection** with auto-detect option (16+ languages)
- 🇱🇰 **Target language fixed to Sinhala** (si-LK)
- ⚡ **Gemini 1.5 Flash** for fast, cost-efficient AI translation
- 📊 **Progress stepper** — Upload → Translating → Done
- 👁️ **In-browser preview** of the first 20 translated subtitle entries
- ⬇️ **Download** the translated `.srt` file instantly
- ❗ **Clear error messages** with retry support

## Getting Started

### Prerequisites

- Node.js 18+
- A [Gemini API key](https://aistudio.google.com/app/apikey) (free tier available)

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env.local` and fill in your Gemini API key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── convert/
│   │       └── route.ts      # POST /api/convert — file validation + Gemini translation
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Main UI (upload, stepper, preview, download)
└── lib/
    ├── srt-parser.ts         # SRT parse/build/validate utilities
    └── gemini.ts             # Gemini AI translation (batched, model: gemini-1.5-flash)
```

## Extending to VTT

The SRT parser (`src/lib/srt-parser.ts`) is designed to be extended. To add VTT support:
1. Add a `parseVTT` function in `src/lib/srt-parser.ts` that converts VTT blocks into `SubtitleBlock[]`.
2. Update the API route to accept `.vtt` files and route them through `parseVTT`.
3. Update the client file input `accept` attribute to include `.vtt`.

## Tech Stack

- **Next.js 16** (App Router, API Routes)
- **React 19** with TypeScript
- **Tailwind CSS 4**
- **Google Gemini 1.5 Flash** via `@google/generative-ai`
