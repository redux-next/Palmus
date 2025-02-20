"use client"

import { Play, Pause, Heart } from 'lucide-react'
import { usePlayerStore } from '@/lib/playerStore'
import { Marquee } from '@/components/ui/marquee'
import { formatTime } from '@/components/ui/formatTime'
import { Progress } from "@/components/ui/Progress"
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import FullScreenPlayer from './FullScreenPlayer'
import Link from 'next/link'

interface AudioPlayerInterface {
  seek: (time: number) => void
}

const BottomPlayer = () => {
  const [isExpanded, setIsExpanded] = useState(false)
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

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (time: number) => {
    const audioPlayer = (window as { audioPlayer?: AudioPlayerInterface }).audioPlayer
    if (audioPlayer) {
      audioPlayer.seek(time)
    }
  }

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentSong) return

    if (isLiked) {
      removeLikedSong(currentSong.id)
    } else {
      addLikedSong({
        id: currentSong.id,
        name: currentSong.name,
        artists: currentSong.artists,
        album: currentSong.album
      })
    }
  }

  if (!currentSong) return null

  return (
    <>
      <motion.div
        layoutId="bottom-player"
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-[50px] left-0 right-0 p-2 m-4 rounded-2xl bg-background/75 backdrop-blur-2xl border flex items-center justify-between cursor-pointer z-30"
      >
        <div className="flex items-center min-w-0 flex-1">
          <motion.img
            layoutId="cover-image"
            src={currentSong.album.cover || "/placeholder.svg"}
            alt="Album cover"
            className="w-[60px] h-[60px] rounded-xl shrink-0 object-cover"
          />
          <div className="min-w-0 flex-1 mx-2">
            <motion.div layoutId="song-title">
              <Marquee>
                {currentSong.name} • <span className="text-muted-foreground">
                  {currentSong.artists.map((artist, index) => (
                    <span key={artist.id}>
                      {index > 0 && " / "}
                      <Link
                        href={`/artist/${artist.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {artist.name}
                      </Link>
                    </span>
                  ))}
                </span>
              </Marquee>
            </motion.div>
            {lyrics.length > 0 && currentLyricIndex >= 0 && (
              <motion.div layoutId="lyrics-container">
                <Marquee className="text-sm text-muted-foreground mt-0.5">
                  {lyrics[currentLyricIndex]?.text}
                </Marquee>
              </motion.div>
            )}
            <motion.div layoutId="progress-container" className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
              <Progress
                value={currentTime}
                max={duration}
                onValueChange={handleSeek}
                className="flex-grow"
              />
              <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
            </motion.div>
          </div>
        </div>
        <motion.div layoutId="controls-container" className="flex items-center space-x-2 shrink-0">
          <motion.button
            className={`p-2 flex items-center justify-center ${isLiked ? 'text-primary' : ''}`}
            onClick={handleLikeToggle}
            whileTap={{ scale: 0.8 }}
          >
            <Heart fill={isLiked ? "currentColor" : "none"} />
          </motion.button>
          <motion.button
            layoutId="play-button"
            className="p-2 flex items-center justify-center"
            onClick={handlePlayPause}
            whileTap={{ scale: 0.8 }}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </motion.button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <FullScreenPlayer onClose={() => setIsExpanded(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

export default BottomPlayer