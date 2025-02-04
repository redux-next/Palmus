"use client"

import { Play, Pause, SkipBack, SkipForward, Heart } from 'lucide-react'
// 移除 Repeat 和 RepeatOne import
import { usePlayerStore } from '@/lib/playerStore'
import { Marquee } from '@/components/ui/marquee'
import { formatTime } from '@/components/ui/formatTime'
import { Progress } from "@/components/ui/Progress"
import { LyricDisplay } from '@/components/ui/LyricDisplay'
import { Visualizer } from './ui/Visualizer'

const MusicPlayer = () => {
  const currentSong = usePlayerStore((state) => state.currentSong)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  // 移除 isLooping
  const isLiked = usePlayerStore((state) => currentSong ? state.isLikedSong(currentSong.id) : false)
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying)
  // 移除 setIsLooping
  const addLikedSong = usePlayerStore((state) => state.addLikedSong)
  const removeLikedSong = usePlayerStore((state) => state.removeLikedSong)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const playNextSong = usePlayerStore((state) => state.playNextSong)
  const playPreviousSong = usePlayerStore((state) => state.playPreviousSong)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // 移除 handleLoopToggle

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

  const handleSeek = (time: number) => {
    if ((window as unknown as { audioPlayer?: { seek: (time: number) => void } }).audioPlayer) {
      (window as unknown as { audioPlayer: { seek: (time: number) => void } }).audioPlayer.seek(time)
    }
  }

  if (!currentSong) return null

  return (
    <div>
      <LyricDisplay />
      <div className="flex items-center space-x-4">
        <img
          src={currentSong.cover || "/placeholder.svg"}
          alt="Album cover"
          width={60}
          height={60}
          className="rounded-xl shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="w-full">
            <Marquee className="font-semibold">{currentSong.name}</Marquee>
            <Marquee className="text-sm text-muted-foreground">{currentSong.artists}</Marquee>
          </div>
        </div>
      </div>
      <div>
        <Progress
          value={currentTime}
          max={duration}
          onValueChange={handleSeek}
          className="my-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="flex justify-center space-x-3 mt-2">
          <button className="p-2">
            <Visualizer />
          </button>
          <button className="p-2" onClick={playPreviousSong}>
            <SkipBack />
          </button>
          <button
            className="p-2"
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause /> : <Play />}
          </button>
          <button className="p-2" onClick={playNextSong}>
            <SkipForward />
          </button>
          <button className={`p-2 ${isLiked ? 'text-primary' : ''}`} onClick={handleLikeToggle}>
            <Heart fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MusicPlayer

