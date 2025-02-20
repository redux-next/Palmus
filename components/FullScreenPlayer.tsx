"use client"

import { Play, Pause, Heart, ChevronDown, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from 'lucide-react'
import { usePlayerStore } from '@/lib/playerStore'
import { formatTime } from '@/components/ui/formatTime'
import { Progress } from "@/components/ui/Progress"
import { AnimatePresence, motion } from 'framer-motion'
import { useState, useCallback } from 'react'
import { Slider } from "@/components/ui/slider"
import Link from 'next/link'

interface AudioPlayerInterface {
  seek: (time: number) => void
}

interface FullScreenPlayerProps {
  onClose: () => void
}

const FullScreenPlayer = ({ onClose }: FullScreenPlayerProps) => {
  const currentSong = usePlayerStore((state) => state.currentSong)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const lyrics = usePlayerStore((state) => state.lyrics)
  const currentLyricIndex = usePlayerStore((state) => state.currentLyricIndex)
  const playNextSong = usePlayerStore((state) => state.playNextSong)
  const playPreviousSong = usePlayerStore((state) => state.playPreviousSong)
  const isLiked = usePlayerStore((state) => currentSong ? state.isLikedSong(currentSong.id) : false)
  const addLikedSong = usePlayerStore((state) => state.addLikedSong)
  const removeLikedSong = usePlayerStore((state) => state.removeLikedSong)
  const volume = usePlayerStore((state) => state.volume)
  const isMuted = usePlayerStore((state) => state.isMuted)
  const setVolume = usePlayerStore((state) => state.setVolume)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

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

  const handleSeek = (time: number) => {
    const audioPlayer = (window as { audioPlayer?: AudioPlayerInterface }).audioPlayer
    if (audioPlayer) {
      audioPlayer.seek(time)
    }
  }

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0])
  }, [setVolume])

  const handleVolumeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowVolumeSlider(prev => !prev)
  }, [])

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={24} />
    if (volume < 0.5) return <Volume1 size={24} />
    return <Volume2 size={24} />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50"
    >
      <div className="h-full flex flex-col p-6">
        <motion.button
          layoutId="close-button"
          onClick={onClose}
          className="mb-4"
        >
          <ChevronDown size={24} />
        </motion.button>

        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <motion.img
            layoutId="cover-image"
            src={currentSong?.album.cover || "/placeholder.svg"}
            alt="Album cover"
            className="w-64 h-64 rounded-2xl shadow-xl"
          />

          <div className="w-full text-center space-y-2">
            <motion.div
              layoutId="song-title"
              className="text-2xl font-semibold"
            >
              {currentSong?.name}
            </motion.div>

            <motion.div
              layoutId="song-artist"
              className="text-muted-foreground"
            >
              {currentSong?.artists.map((artist, index) => (
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
            </motion.div>

            <motion.div
              layoutId="album-name"
              className="text-sm text-muted-foreground"
            >
              {currentSong?.artists && currentSong.artists.length > 0 && (
                <Link
                  href={`/artist/${currentSong.artists[0].id}/album/${currentSong.album.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline"
                >
                  {currentSong.album.name}
                </Link>
              )}
            </motion.div>
          </div>

          {lyrics.length > 0 && (
            <motion.div
              layoutId="lyrics-container"
              className="w-full max-h-32 overflow-y-auto text-center"
            >
              {currentLyricIndex >= 0 && (
                <p className="text-lg">{lyrics[currentLyricIndex]?.text}</p>
              )}
            </motion.div>
          )}

          <div className="w-full space-y-2">
            <motion.div layoutId="progress-container" className="w-full">
              <Progress
                value={currentTime}
                max={duration}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            layoutId="controls-container"
            className="flex items-center justify-center w-full max-w-md mx-auto px-4"
          >
            <div className="flex items-center space-x-6">
              <div className="relative flex items-center">
                <motion.button
                  className="p-2"
                  onClick={handleVolumeClick}
                  whileTap={{ scale: 0.8 }}
                >
                  {getVolumeIcon()}
                </motion.button>
                <AnimatePresence>
                  {showVolumeSlider && (
                    <motion.div
                      className="absolute bottom-full left-1/2 bg-background border rounded-lg px-4 py-1 w-32 h-8 shadow-lg flex items-center justify-center"
                      initial={{ opacity: 0, y: 10, x: "-50%", filter: 'blur(5px)' }}
                      animate={{ opacity: 1, y: 0, x: "-50%", filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: 10, x: "-50%", filter: 'blur(5px)' }}
                      transition={{ duration: 0.2 }}
                    >
                      <Slider
                        defaultValue={[1]}
                        max={1}
                        step={0.01}
                        value={[isMuted ? 0 : volume]}
                        onValueChange={handleVolumeChange}
                        orientation="horizontal"
                        className="w-full"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="p-2"
                onClick={playPreviousSong}
                whileTap={{ scale: 0.8 }}
              >
                <SkipBack size={24} />
              </motion.button>

              <motion.button
                layoutId="play-button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-14 w-14 rounded-[19px] bg-primary text-background flex items-center justify-center"
                whileTap={{ scale: 0.8 }}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </motion.button>

              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="p-2"
                onClick={playNextSong}
                whileTap={{ scale: 0.8 }}
              >
                <SkipForward size={24} />
              </motion.button>

              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`p-2 flex items-center justify-center ${isLiked ? 'text-primary' : ''}`}
                onClick={handleLikeToggle}
                whileTap={{ scale: 0.8 }}
              >
                <Heart fill={isLiked ? "currentColor" : "none"} size={24} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default FullScreenPlayer
