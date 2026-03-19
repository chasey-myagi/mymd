interface Stats {
  wordCount: number
  readingTime: number
}

export function calculateStats(text: string): Stats {
  if (!text.trim()) return { wordCount: 0, readingTime: 0 }
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g) ?? []).length
  const stripped = text.replace(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, ' ')
  const englishWords = stripped.split(/\s+/).filter(w => w.length > 0).length
  const wordCount = cjkChars + englishWords
  const readingTime = Math.max(0, Math.ceil(wordCount / 250))
  return { wordCount, readingTime }
}
