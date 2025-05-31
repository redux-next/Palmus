"use client"

import { Play, Pause, Heart, ChevronDown, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Maximize2 } from 'lucide-react'
import { usePlayerStore } from '@/lib/playerStore'
import { formatTime } from '@/components/ui/formatTime'
import { Progress } from "@/components/ui/Progress"
import Meshbg from '@/components/meshbg'
import FullLyrics from "@/components/FullLyrics"
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
  const lrc = usePlayerStore((state) => state.lrc)
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
  const [showMeshFull, setShowMeshFull] = useState(false)

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
      className="fixed inset-0 bg-background z-50 overflow-y-auto"
    >
      <div className="min-h-full flex flex-col p-6">
        <button
          onClick={onClose}
          className="mb-4"
        >
          <ChevronDown size={24} />
        </button>

        <div className="h-[90dvh] flex flex-col items-center justify-center space-y-8">
          <motion.img
            layoutId="cover-image"
            src={currentSong?.album.cover || "/placeholder.svg"}
            alt="Album cover"
            className="w-64 h-64 rounded-2xl shadow-xl"
          />

          <div className="w-full text-center space-y-2">
            <div
              className="text-2xl font-semibold"
            >
              {currentSong?.name}
            </div>

            <div
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
            </div>

            <div
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
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="w-full">
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
            </div>
          </div>

          <div
            className="flex items-center justify-center w-full max-w-md mx-auto px-4"
          >
            <div className="flex items-center space-x-6">
              <div className="relative flex items-center">
                <button
                  className="p-2"
                  onClick={handleVolumeClick}
                >
                  {getVolumeIcon()}
                </button>
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

              <button
                className="p-2"
                onClick={playPreviousSong}
              >
                <SkipBack size={24} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-14 w-14 rounded-[19px] bg-primary text-background flex items-center justify-center"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>

              <button
                className="p-2"
                onClick={playNextSong}
              >
                <SkipForward size={24} />
              </button>

              <button
                className={`p-2 flex items-center justify-center ${isLiked ? 'text-primary' : ''}`}
                onClick={handleLikeToggle}
              >
                <Heart fill={isLiked ? "currentColor" : "none"} size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* 歌詞卡片區塊，放在播放按鈕下方 */}
        {lrc.length > 0 && (
          <div className="w-full flex justify-center mt-6 pb-6">
            <div className="relative w-full max-w-xl rounded-xl overflow-hidden">
              {/* Meshbg 作為背景 */}
              <div className="absolute inset-0 z-0 pointer-events-none rounded-xl brightness-75 contrast-125">
                <Meshbg imageUrl={currentSong?.album.cover || "/placeholder.svg"} fps={30} />
              </div>
              {/* 歌詞卡片內容 */}
              <div className="relative z-10 rounded-xl shadow-lg px-6 py-4 border border-border">
                <div className="flex flex-col items-center space-y-1 font-semibold">
                  {lrc
                    .slice(
                      Math.max(
                        0,
                        currentLyricIndex - 2
                      ),
                      Math.max(
                        0,
                        currentLyricIndex - 2                ) + 5
                    )
                    .map((line: import('@/lib/playerStore').LyricLine, idx: number) => {
                      const realIdx = Math.max(0, currentLyricIndex - 2) + idx
                      const isCurrent = realIdx === currentLyricIndex
                      return (
                        <span
                          key={realIdx}
                          className={`w-full text-center transition-all ${
                            isCurrent
                              ? "text-white"
                              : "text-white/30"
                          }`}
                        >
                          {line.words?.[0]?.word || ''}
                        </span>
                      )
                    })}
                </div>
                {/* Zoom in button */}
                <button
                  className="absolute bottom-3 right-3 z-20 bg-background/70 hover:bg-background/90 rounded-full p-2 shadow transition"
                  onClick={() => setShowMeshFull(true)}
                  title="Fullscreen"
                  type="button"
                >
                  <Maximize2 size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 全螢幕 Meshbg canvas（共用元件） */}
        <FullLyrics
          open={showMeshFull}
          onClose={() => setShowMeshFull(false)}
          imageUrl={currentSong?.album.cover || "/placeholder.svg"}
          fps={30}
        />

      </div>
    </motion.div>
  )
}

export default FullScreenPlayer
