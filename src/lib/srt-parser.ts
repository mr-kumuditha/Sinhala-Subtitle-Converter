export interface SubtitleBlock {
  index: number;
  timestamp: string;
  text: string;
}

/**
 * Parses an SRT file content into an array of subtitle blocks.
 * Each block contains the index, timestamp line, and text content.
 */
export function parseSRT(content: string): SubtitleBlock[] {
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split into blocks by double newline
  const rawBlocks = normalized.split(/\n\n+/);

  const blocks: SubtitleBlock[] = [];

  for (const rawBlock of rawBlocks) {
    const lines = rawBlock.trim().split("\n");
    if (lines.length < 3) continue;

    const indexLine = lines[0].trim();
    const timestampLine = lines[1].trim();
    const textLines = lines.slice(2).join("\n").trim();

    // Validate index (must be a number)
    const index = parseInt(indexLine, 10);
    if (isNaN(index)) continue;

    // Validate timestamp format: HH:MM:SS,mmm --> HH:MM:SS,mmm
    const timestampRegex =
      /^\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/;
    if (!timestampRegex.test(timestampLine)) continue;

    if (!textLines) continue;

    blocks.push({
      index,
      timestamp: timestampLine,
      text: textLines,
    });
  }

  return blocks;
}

/**
 * Rebuilds a valid SRT file from subtitle blocks.
 * Uses the original index and timestamp, but uses the provided text.
 */
export function buildSRT(blocks: SubtitleBlock[]): string {
  return (
    blocks
      .map(
        (block) => `${block.index}\n${block.timestamp}\n${block.text}`
      )
      .join("\n\n") + "\n"
  );
}

/**
 * Validates SRT file content and returns any validation errors.
 */
export function validateSRT(content: string): string | null {
  if (!content || content.trim().length === 0) {
    return "File appears to be empty.";
  }

  const blocks = parseSRT(content);
  if (blocks.length === 0) {
    return "No valid subtitle blocks found. Please ensure the file is a valid SRT file.";
  }

  return null;
}
