import { usePlayerStore } from '@/lib/playerStore'

export function LyricDisplay() {
  const { lyrics, currentLyricIndex } = usePlayerStore()

  if (lyrics.length === 0) return null

  const cleanText = (text: string) => {
    return text
      ?.replace(/&nbsp;/g, ' ')
      ?.replace(/\u00A0/g, ' ')
      ?.replace(/\s+/g, ' ')
      ?.trim() || ''
  }

  const prevLine = currentLyricIndex > 0 ? cleanText(lyrics[currentLyricIndex - 1]?.text) : ""
  const currentLine = cleanText(lyrics[currentLyricIndex]?.text || "")
  const nextLine = currentLyricIndex < lyrics.length - 1 ? cleanText(lyrics[currentLyricIndex + 1]?.text) : ""

  return (
    <div className="space-y-2 py-4 text-center">
      <p className="text-sm text-muted-foreground/50 truncate">{prevLine}</p>
      <p className="text-sm font-medium">{currentLine}</p>
      <p className="text-sm text-muted-foreground/50 truncate">{nextLine}</p>
    </div>
  )
}
