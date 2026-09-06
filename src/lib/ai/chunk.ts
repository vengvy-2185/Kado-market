/**
 * Splits extracted document text into overlap-free chunks for storage in
 * ai_document_chunks. Chunk boundaries prefer paragraph breaks, falling
 * back to a hard character cut if a single paragraph is too long.
 */
export function chunkText(text: string, maxLen = 800): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const candidate = current ? `${current}\n\n${para}` : para;
    if (candidate.length <= maxLen) {
      current = candidate;
      continue;
    }
    if (current) {
      chunks.push(current);
      current = "";
    }
    if (para.length <= maxLen) {
      current = para;
    } else {
      // hard-split an overly long paragraph
      for (let i = 0; i < para.length; i += maxLen) {
        chunks.push(para.slice(i, i + maxLen));
      }
    }
  }
  if (current) chunks.push(current);

  return chunks;
}
