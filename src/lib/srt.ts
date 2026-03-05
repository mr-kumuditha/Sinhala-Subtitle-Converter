export interface SubtitleBlock {
  index: number;
  timestamp: string;
  text: string;
}

export function parseSRT(srtContent: string): SubtitleBlock[] {
  const normalized = srtContent.replace(/\r\n/g, '\n').trim();
  const blocks = normalized.split(/\n\n+/);
  
  return blocks.filter((block) => block.trim() !== '').map((block) => {
    const lines = block.split('\n');
    const index = parseInt(lines[0].trim(), 10);
    const timestamp = lines[1].trim();
    const text = lines.slice(2).join('\n').trim();
    return { index: isNaN(index) ? 0 : index, timestamp, text };
  });
}

export function buildSRT(blocks: SubtitleBlock[]): string {
  return blocks
    .map((block) => {
      return `${block.index}\n${block.timestamp}\n${block.text}`;
    })
    .join('\n\n') + '\n';
}
