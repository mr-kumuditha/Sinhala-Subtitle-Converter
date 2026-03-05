import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { SubtitleBlock } from "./srt-parser";

const BATCH_SIZE = 50;
const MODEL_NAME = "gemini-1.5-flash";

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file."
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Translates an array of subtitle blocks to the target language using Gemini.
 * Preserves indices and timestamps; only translates the text.
 */
export async function translateSubtitles(
  blocks: SubtitleBlock[],
  targetLanguage: string = "Sinhala",
  sourceLanguage: string = "auto-detect"
): Promise<SubtitleBlock[]> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const translatedBlocks: SubtitleBlock[] = [];

  // Process in batches
  for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
    const batch = blocks.slice(i, i + BATCH_SIZE);
    const translatedBatch = await translateBatch(
      model,
      batch,
      targetLanguage,
      sourceLanguage
    );
    translatedBlocks.push(...translatedBatch);
  }

  return translatedBlocks;
}

async function translateBatch(
  model: GenerativeModel,
  blocks: SubtitleBlock[],
  targetLanguage: string,
  sourceLanguage: string
): Promise<SubtitleBlock[]> {
  // Format blocks as numbered text for translation
  const textToTranslate = blocks
    .map((b, i) => `[${i + 1}] ${b.text.replace(/\n/g, " ")}`)
    .join("\n");

  const sourceLangNote =
    sourceLanguage === "auto-detect"
      ? "Detect the source language automatically."
      : `The source language is ${sourceLanguage}.`;

  const prompt = `You are a professional subtitle translator. ${sourceLangNote}
Translate the following subtitle lines to ${targetLanguage}.
IMPORTANT rules:
- Keep the numbering format [N] exactly as-is at the start of each line.
- Translate ONLY the text after the [N] marker.
- Do NOT merge or split lines.
- Do NOT add any explanations or extra text.
- Output exactly ${blocks.length} lines, one per input line.

${textToTranslate}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  const lines = response.trim().split("\n");

  // Parse translated lines back into blocks
  const translatedBlocks: SubtitleBlock[] = blocks.map((block, i) => {
    // Find the line matching [i+1]
    const matchingLine = lines.find((l: string) =>
      l.trimStart().startsWith(`[${i + 1}]`)
    );

    let translatedText = block.text; // fallback to original
    if (matchingLine) {
      const withoutIndex = matchingLine.replace(/^\s*\[\d+\]\s*/, "").trim();
      if (withoutIndex) {
        translatedText = withoutIndex;
      }
    }

    return {
      ...block,
      text: translatedText,
    };
  });

  return translatedBlocks;
}
