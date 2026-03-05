import { NextRequest, NextResponse } from "next/server";
import { parseSRT, buildSRT, validateSRT } from "@/lib/srt-parser";
import { translateSubtitles } from "@/lib/gemini";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const sourceLanguage = (formData.get("sourceLanguage") as string) || "auto-detect";

    // --- Server-side validation ---
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".srt")) {
      return NextResponse.json(
        { error: "Invalid file type. Only .srt files are supported." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.` },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    // Validate SRT content
    const validationError = validateSRT(content);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Parse SRT into blocks
    const blocks = parseSRT(content);

    // Translate using Gemini
    const translatedBlocks = await translateSubtitles(
      blocks,
      "Sinhala",
      sourceLanguage
    );

    // Rebuild the SRT file
    const translatedSRT = buildSRT(translatedBlocks);

    // Return the translated SRT with preview data
    const preview = translatedBlocks.slice(0, 20).map((b) => ({
      index: b.index,
      timestamp: b.timestamp,
      text: b.text,
    }));

    return NextResponse.json({
      srt: translatedSRT,
      preview,
      totalBlocks: translatedBlocks.length,
    });
  } catch (error) {
    console.error("Conversion error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    // Distinguish API key / Gemini errors
    if (
      message.includes("GEMINI_API_KEY") ||
      message.includes("API_KEY_INVALID") ||
      message.includes("API key")
    ) {
      return NextResponse.json(
        {
          error:
            "Gemini API key is missing or invalid. Please check your server configuration.",
        },
        { status: 500 }
      );
    }

    if (message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        {
          error:
            "Gemini API quota exceeded. Please try again later or check your billing.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: `Translation failed: ${message}` },
      { status: 500 }
    );
  }
}
