import { usePlayerStore } from '@/lib/playerStore'

export function LyricDisplay() {
  const { lrc, currentLyricIndex } = usePlayerStore()

  if (lrc.length === 0) return null

  const cleanText = (words: Array<{ start_time: number; end_time: number; word: string }>) => {
    return words?.[0]?.word
      ?.replace(/&nbsp;/g, ' ')
      ?.replace(/\u00A0/g, ' ')
      ?.replace(/\s+/g, ' ')
      ?.trim() || ''
  }

  const prevLine = currentLyricIndex > 0 ? cleanText(lrc[currentLyricIndex - 1]?.words) : ""
  const currentLine = cleanText(lrc[currentLyricIndex]?.words || [])
  const nextLine = currentLyricIndex < lrc.length - 1 ? cleanText(lrc[currentLyricIndex + 1]?.words) : ""

  return (
    <div className="space-y-2 py-4 text-center">
      <p className="text-sm text-muted-foreground/50 truncate">{prevLine}</p>
      <p className="text-sm font-medium">{currentLine}</p>
      <p className="text-sm text-muted-foreground/50 truncate">{nextLine}</p>
    </div>
  )
}
