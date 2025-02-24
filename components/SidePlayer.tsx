"use client"

import { Play, Pause, SkipBack, SkipForward, Heart, Volume2, Volume1, VolumeX } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayerStore } from '@/lib/playerStore'
import { Marquee } from '@/components/ui/marquee'
import { formatTime } from '@/components/ui/formatTime'
import { Progress } from "@/components/ui/Progress"
import { LyricDisplay } from '@/components/ui/LyricDisplay'
import { Slider } from "@/components/ui/slider"
import { useState, useCallback } from 'react'
import { TooltipButton } from './ui/TooltipButton'
import Link from 'next/link'
import { CircleProgress } from '@/components/ui/CircleProgress'

const MusicPlayer = ({ collapsed }: { collapsed?: boolean }) => {
  const currentSong = usePlayerStore((state) => state.currentSong)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const isLiked = usePlayerStore((state) => currentSong ? state.isLikedSong(currentSong.id) : false)
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying)
  const addLikedSong = usePlayerStore((state) => state.addLikedSong)
  const removeLikedSong = usePlayerStore((state) => state.removeLikedSong)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const playNextSong = usePlayerStore((state) => state.playNextSong)
  const playPreviousSong = usePlayerStore((state) => state.playPreviousSong)
  const volume = usePlayerStore((state) => state.volume)
  const isMuted = usePlayerStore((state) => state.isMuted)
  const setVolume = usePlayerStore((state) => state.setVolume)
  const toggleMute = usePlayerStore((state) => state.toggleMute)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
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
        album: currentSong.album
      })
    }
  }

  const handleSeek = (time: number) => {
    if ((window as unknown as { audioPlayer?: { seek: (time: number) => void } }).audioPlayer) {
      (window as unknown as { audioPlayer: { seek: (time: number) => void } }).audioPlayer.seek(time)
    }
  }

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0])
  }, [setVolume])

  const handleVolumeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    toggleMute()
  }, [toggleMute])

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX />
    if (volume < 0.5) return <Volume1 />
    return <Volume2 />
  }

  if (!currentSong) return null

  if (collapsed) {
    const progress = duration > 0 ? currentTime / duration : 0;

    return (
      <div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collapsed View */}
        <div className="flex flex-col items-center gap-2">
          <CircleProgress
            progress={progress}
            size={40}
            strokeWidth={3}
            className="mb-1"
          />
          <img
            src={currentSong.album.cover || "/placeholder.svg"}
            alt="Album cover"
            width={40}
            height={40}
            className="rounded-xl shrink-0 cursor-pointer"
          />
        </div>

        {/* Expanded Hover View */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
              transition={{ duration: 0.3}}
              className="absolute bottom-full left-0 mb-2 bg-background/75 backdrop-blur-2xl border shadow-lg rounded-xl p-4 w-72 z-50"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={currentSong.album.cover || "/placeholder.svg"}
                  alt="Album cover"
                  width={60}
                  height={60}
                  className="rounded-xl shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="w-full">
                    <Marquee className="font-semibold">{currentSong.name}</Marquee>
                    <Marquee className="text-sm text-muted-foreground">
                      {currentSong.artists.map((artist, index) => (
                        <span key={artist.id}>
                          {index > 0 && " / "}
                          <Link href={`/artist/${artist.id}`} className="hover:underline">
                            {artist.name}
                          </Link>
                        </span>
                      ))}
                    </Marquee>
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
                  {/* Volume Control - Updated */}
                  <div className="relative flex items-center">
                    <motion.button
                      className="p-2"
                      onClick={handleVolumeClick}
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {getVolumeIcon()}
                    </motion.button>
                    <AnimatePresence>
                      {showVolumeSlider && (
                        <motion.div
                          className="absolute bottom-full left-1/2 bg-background border rounded-lg py-4 px-1 h-32 w-8 shadow-lg flex items-center justify-center"
                          initial={{ 
                            opacity: 0, 
                            y: 10,
                            x: "-50%",
                            filter: 'blur(5px)',
                          }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            x: "-50%",
                            filter: 'blur(0px)' 
                          }}
                          exit={{ 
                            opacity: 0, 
                            y: 10,
                            x: "-50%",
                            filter: 'blur(5px)'
                          }}
                          transition={{ duration: 0.2 }}
                          onMouseEnter={() => setShowVolumeSlider(true)}
                          onMouseLeave={() => setShowVolumeSlider(false)}
                        >
                          <Slider
                            defaultValue={[1]}
                            max={1}
                            step={0.01}
                            value={[isMuted ? 0 : volume]}
                            onValueChange={handleVolumeChange}
                            orientation="vertical"
                            className="h-full"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <TooltipButton
                    icon={<SkipBack />}
                    tooltip="Previous"
                    onClick={playPreviousSong}
                  />

                  <TooltipButton
                    icon={isPlaying ? <Pause /> : <Play />}
                    tooltip={isPlaying ? "Pause" : "Play"}
                    onClick={handlePlayPause}
                  />

                  <TooltipButton
                    icon={<SkipForward />}
                    tooltip="Next"
                    onClick={playNextSong}
                  />

                  <TooltipButton
                    icon={<Heart fill={isLiked ? "currentColor" : "none"} />}
                    tooltip={isLiked ? "Remove from Liked" : "Add to Liked"}
                    onClick={handleLikeToggle}
                    className={isLiked ? 'text-primary' : ''}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Regular (Expanded) View
  return (
    <div>
      <LyricDisplay />
      <div className="flex items-center space-x-4">
        <img
          src={currentSong.album.cover || "/placeholder.svg"}
          alt="Album cover"
          width={collapsed ? 40 : 60}
          height={collapsed ? 40 : 60}
          className="rounded-xl shrink-0 cursor-pointer"
        />
        <div className="min-w-0 flex-1">
          <div className="w-full">
            <Marquee className="font-semibold">{currentSong.name}</Marquee>
            <Marquee className="text-sm text-muted-foreground">
              {currentSong.artists.map((artist, index) => (
                <span key={artist.id}>
                  {index > 0 && " / "}
                  <Link href={`/artist/${artist.id}`} className="hover:underline">
                    {artist.name}
                  </Link>
                </span>
              ))}
            </Marquee>
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
          <div className="relative flex items-center">
            <motion.button
              className="p-2"
              onClick={handleVolumeClick}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
            >
              {getVolumeIcon()}
            </motion.button>
            <AnimatePresence>
              {showVolumeSlider && (
                <motion.div
                  className="absolute bottom-full left-1/2 bg-background border rounded-lg py-4 px-1 h-32 w-8 shadow-lg flex items-center justify-center"
                  initial={{ 
                    opacity: 0, 
                    y: 10,
                    x: "-50%",
                    filter: 'blur(5px)',
                  }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    x: "-50%",
                    filter: 'blur(0px)' 
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: 10,
                    x: "-50%",
                    filter: 'blur(5px)'
                  }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <Slider
                    defaultValue={[1]}
                    max={1}
                    step={0.01}
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    orientation="vertical"
                    className="h-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <TooltipButton
            icon={<SkipBack />}
            tooltip="Previous"
            onClick={playPreviousSong}
          />

          <TooltipButton
            icon={isPlaying ? <Pause /> : <Play />}
            tooltip={isPlaying ? "Pause" : "Play"}
            onClick={handlePlayPause}
          />

          <TooltipButton
            icon={<SkipForward />}
            tooltip="Next"
            onClick={playNextSong}
          />

          <TooltipButton
            icon={<Heart fill={isLiked ? "currentColor" : "none"} />}
            tooltip={isLiked ? "Remove from Liked" : "Add to Liked"}
            onClick={handleLikeToggle}
            className={isLiked ? 'text-primary' : ''}
          />
        </div>
      </div>
    </div>
  )
}

export default MusicPlayer

