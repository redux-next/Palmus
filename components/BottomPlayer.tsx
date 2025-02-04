"use client"

import { Play, Pause, Heart } from 'lucide-react'
import { usePlayerStore } from '@/lib/playerStore'
import { Marquee } from '@/components/ui/marquee'
import { formatTime } from '@/components/ui/formatTime'
import { Progress } from "@/components/ui/Progress"

interface AudioPlayerInterface {
  seek: (time: number) => void
}

const BottomPlayer = () => {
  const currentSong = usePlayerStore((state) => state.currentSong)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const isLiked = usePlayerStore((state) => currentSong ? state.isLikedSong(currentSong.id) : false)
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying)
  const addLikedSong = usePlayerStore((state) => state.addLikedSong)
  const removeLikedSong = usePlayerStore((state) => state.removeLikedSong)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const lyrics = usePlayerStore((state) => state.lyrics)
  const currentLyricIndex = usePlayerStore((state) => state.currentLyricIndex)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (time: number) => {
    const audioPlayer = (window as { audioPlayer?: AudioPlayerInterface }).audioPlayer
    if (audioPlayer) {
      audioPlayer.seek(time)
    }
  }

  const handleLikeToggle = () => {
    if (!currentSong) return
    
    if (isLiked) {
      removeLikedSong(currentSong.id)
    } else {
      addLikedSong({
        id: currentSong.id,
        name: currentSong.name,
        artists: currentSong.artists,
        cover: currentSong.cover
      })
    }
  }

  if (!currentSong) return null

  return (
    <div className="fixed bottom-[50px] left-0 right-0 p-2 m-4 rounded-2xl bg-background/75 backdrop-blur-2xl border flex items-center justify-between">
      <div className="flex items-center min-w-0 flex-1">
        <img
          src={currentSong.cover || "/placeholder.svg"}
          alt="Album cover"
          className="w-[60px] h-[60px] rounded-xl shrink-0 object-cover"
        />
        <div className="min-w-0 flex-1 mx-2">
          <Marquee>
            {currentSong.name} • <span className="text-muted-foreground">{currentSong.artists}</span>
          </Marquee>
          {lyrics.length > 0 && currentLyricIndex >= 0 && (
            <Marquee className="text-sm text-muted-foreground mt-0.5">
              {lyrics[currentLyricIndex]?.text}
            </Marquee>
          )}
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
            <Progress
              value={currentTime}
              max={duration}
              onValueChange={handleSeek}
              className="flex-grow"
            />
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 shrink-0">
        <button 
          className={`p-2 flex items-center justify-center ${isLiked ? 'text-primary' : ''}`}
          onClick={handleLikeToggle}
        >
          <Heart fill={isLiked ? "currentColor" : "none"} />
        </button>
        <button className="p-2 flex items-center justify-center" onClick={handlePlayPause}>
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
      </div>
    </div>
  )
}

export default BottomPlayer
