"use client"

import { useEffect, useRef, useCallback } from 'react'
import { usePlayerStore } from '@/lib/playerStore'
import ColorThief from 'colorthief'
import { useColorStore } from '@/lib/colorStore'

interface AudioPlayerInterface {
  seek: (time: number) => void
}

interface PaletteType {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  border: string;
  input: string;
  ring: string;
  radius: string;
  "chart-1": string;
  "chart-2": string;
  "chart-3": string;
  "chart-4": string;
  "chart-5": string;
}

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  const { 
    currentSong, 
    isPlaying,
    isLoading,
    userInteracted,
    setUserInteracted,
    setIsPlaying, 
    setCurrentTime, 
    setDuration,
    lyrics,
    setCurrentLyricIndex,
    audioQuality,
    setMusicUrl,
    setAnalyserData,
    playNextSong,
    playPreviousSong,
    likedSongs,
    setIsLoading,
    setLyrics
  } = usePlayerStore()

  const volume = usePlayerStore((state) => state.volume)
  const isMuted = usePlayerStore((state) => state.isMuted)

  // Media Session 初始化
  const initializeMediaSession = useCallback(() => {
    if (!('mediaSession' in navigator) || !currentSong) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.name || '未知歌曲',
      artist: currentSong.artists || '未知藝人',
      album: currentSong.albumName || '未知專輯',
      artwork: [
        { src: currentSong.cover || '/default-cover.jpg', sizes: '512x512', type: 'image/jpeg' }
      ]
    })

    const actionHandlers: [MediaSessionAction, () => void][] = [
      ['play', () => { setIsPlaying(true); audioRef.current?.play() }],
      ['pause', () => { setIsPlaying(false); audioRef.current?.pause() }],
      ['previoustrack', playPreviousSong],
      ['nexttrack', playNextSong]
    ]

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler)
      } catch (error) {
        console.error('Error fetching playlist:', error)
      }
    })
  }, [currentSong, playNextSong, playPreviousSong, setIsPlaying])

  useEffect(() => {
    initializeMediaSession()
  }, [initializeMediaSession])

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }
  }, [isPlaying])

  // 鍵盤控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 檢查當前焦點元素是否為輸入框、文字區域等
      const isInputActive = document.activeElement instanceof HTMLInputElement ||
                          document.activeElement instanceof HTMLTextAreaElement ||
                          document.activeElement?.hasAttribute('contenteditable');
      
      // 如果正在輸入，則不處理媒體控制快捷鍵
      if (isInputActive) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          setIsPlaying(!isPlaying)
          break
        case 'ArrowRight':
          handleSeek((audioRef.current?.currentTime || 0) + 10)
          break
        case 'ArrowLeft':
          handleSeek((audioRef.current?.currentTime || 0) - 10)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, setIsPlaying])

  // 獲取音樂URL和歌詞
  useEffect(() => {
    const refreshMusicUrl = async () => {
      if (currentSong?.id && !currentSong?.musicUrl) {
        try {
          setIsLoading(true)
          const response = await fetch(`/api/play?id=${currentSong.id}&quality=${audioQuality}`)
          const data = await response.json()
          
          if (data.code === 200) {
            if (data.music_url) {
              setMusicUrl(data.music_url)
            }
            
            if (data.lrc) {
              const lines = data.lrc.split('\n')
              const timeRegex = /\[(\d+):(\d{2})([:.](\d{2,3}))?\]/g

              const parsedLyrics = lines
                .flatMap((line: string) => {
                  const matches = Array.from(line.matchAll(timeRegex))
                  const text = line.replace(timeRegex, '').trim()
                  
                  return matches.map(match => {
                    const minutes = parseInt(match[1])
                    const seconds = parseInt(match[2])
                    const fraction = match[4] ? parseInt(match[4]) : 0
                    
                    const time = minutes * 60 + seconds + 
                      (match[4]?.length === 3 ? fraction / 1000 : fraction / 100)
                    
                    return { time: Number(time.toFixed(3)), text }
                  })
                })
                .filter((line: { text: string }): line is { time: number; text: string } => 
                  !!line && line.text !== ''
                )
                .sort((a: { time: number }, b: { time: number }) => a.time - b.time)

              setLyrics(parsedLyrics)
            } else {
              setLyrics([])
            }

            setIsLoading(false)
            if (userInteracted) {
              audioRef.current?.play().catch(console.error)
            }
          }
        } catch (error) {
          console.error('獲取音樂URL失敗:', error)
          setIsLoading(false)
        }
      }
    }

    refreshMusicUrl()
  }, [currentSong?.id, audioQuality, userInteracted, setLyrics, setIsLoading, setMusicUrl])

  // 播放控制
  useEffect(() => {
    if (!audioRef.current) return

    const handlePlay = () => {
      if (isPlaying && !isLoading) {
        void audioRef.current?.play()?.catch(error => {
          if (error.name === 'NotAllowedError') {
            setUserInteracted(false)
          }
        })
      } else {
        audioRef.current?.pause()
      }
    }

    handlePlay()
  }, [isPlaying, isLoading, currentSong?.musicUrl])

  // 時間更新處理
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return

    const currentTime = Number(audioRef.current.currentTime.toFixed(3))
    setCurrentTime(currentTime)

    if (lyrics.length === 0) return

    let low = 0
    let high = lyrics.length - 1
    let result = -1

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (lyrics[mid].time <= currentTime) {
        result = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    if (result !== -1) {
      const nextLyric = lyrics[result + 1]
      if (!nextLyric || currentTime < nextLyric.time) {
        setCurrentLyricIndex(result)
      }
    }
  }, [lyrics, setCurrentTime, setCurrentLyricIndex])

  // 跳轉處理
  const handleSeek = useCallback((time: number) => {
    if (!audioRef.current) return

    const duration = Number.isNaN(audioRef.current.duration) ? 0 : audioRef.current.duration
    const safeTime = Math.max(0, Math.min(time, duration))
    
    audioRef.current.currentTime = Number(safeTime.toFixed(3))
    setCurrentTime(safeTime)
    
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: audioRef.current.playbackRate,
        position: safeTime
      })
    }
  }, [setCurrentTime])

  // 全局跳轉接口
  useEffect(() => {
    if (audioRef.current) {
      const audioPlayer: AudioPlayerInterface = { seek: handleSeek }
      Object.assign(window, { audioPlayer });
    }

    return () => {
      if ('audioPlayer' in window) {
        delete (window as { audioPlayer?: AudioPlayerInterface }).audioPlayer;
      }
    }
  }, [handleSeek])

  // 音頻分析器
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current;

    const initializeAudioContext = () => {
      const AudioContextClass = window.AudioContext || 
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      
      if (!AudioContextClass) {
        throw new Error('AudioContext not supported');
      }
      
      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 512
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current!)
      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)
    }

    const updateAnalyser = () => {
      if (!analyserRef.current) return
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      
      const update = () => {
        analyserRef.current!.getByteFrequencyData(dataArray)
        setAnalyserData(new Uint8Array(dataArray))
        animationFrameRef.current = requestAnimationFrame(update)
      }
      update()
    }

    const handlePlay = () => {
      if (!audioContextRef.current) initializeAudioContext()
      updateAnalyser()
    }

    const cleanup = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };

    audio.addEventListener('play', handlePlay)
    return () => {
      audio.removeEventListener('play', handlePlay)
      cleanup();
    }
  }, [setAnalyserData])

  // 元數據加載
  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return

    const duration = Number.isNaN(audioRef.current.duration) ? 0 : audioRef.current.duration
    setDuration(Number(duration.toFixed(3)))

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: audioRef.current.playbackRate,
        position: audioRef.current.currentTime
      })
    }
  }, [setDuration])

  // 新增處理 403 錯誤，重新獲取新連結的方法
  const handleAudioError = useCallback(async () => {
    if (!currentSong) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/play?id=${currentSong.id}&quality=${audioQuality}`);
      const data = await response.json();
      if (data.code === 200 && data.music_url) {
        setMusicUrl(data.music_url);
        // 使用新的連結後嘗試自動播放
        await audioRef.current?.play();
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('重新獲取音樂連結失敗:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
      if (navigator.mediaSession) {
        navigator.mediaSession.setPositionState({ duration: 0, position: 0 });
      }
    }
  }, [currentSong, audioQuality, setIsLoading, setMusicUrl, setIsPlaying]);

  // 在 AudioPlayer 組件中加入以下函數
  const extractColors = async (imageUrl: string) => {
    try {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.src = imageUrl
  
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
  
      const colorThief = new ColorThief()
      const palette = colorThief.getPalette(img, 5)
  
      // 將 RGB 值轉換為 HSL
      const toHSL = (rgb: number[]) => {
        const r = rgb[0] / 255
        const g = rgb[1] / 255
        const b = rgb[2] / 255
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        let h = 0
        let s
        const l = (max + min) / 2
  
        if (max === min) {
          h = s = 0
        } else {
          const d = max - min
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break
            case g: h = (b - r) / d + 2; break
            case b: h = (r - g) / d + 4; break
          }
          h /= 6
        }
  
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
      }
  
      const generatePalettes = (mainColor: number[]) => {
        const hsl = toHSL(mainColor)
        const h = hsl[0]
        
        const light: PaletteType = {
          background: `${h} 45% 97%`,          // 增加飽和度到 45%
          foreground: `${h} 45% 15%`,          // 配合背景增加飽和度
          card: `${h} 40% 99%`,                // 調整以保持與背景的和諧
          "card-foreground": `${h} 45% 15%`,
          popover: `${h} 40% 99%`,
          "popover-foreground": `${h} 45% 15%`,
          primary: `${h} 70% 45%`,             // 增加主色調的飽和度
          "primary-foreground": `${h} 15% 98%`,
          secondary: `${h} 45% 94%`,           // 增加次要顏色的飽和度
          "secondary-foreground": `${h} 45% 15%`,
          muted: `${h} 45% 94%`,
          "muted-foreground": `${h} 45% 40%`,  
          accent: `${h} 45% 94%`,
          "accent-foreground": `${h} 45% 15%`,
          destructive: "0 84% 60%",
          "destructive-foreground": `${h} 15% 98%`,
          border: `${h} 45% 85%`,              // 增加邊框的飽和度
          input: `${h} 45% 85%`,
          ring: `${h} 70% 45%`,
          radius: "0.5rem",
          "chart-1": `${(h + 0) % 360} 76% 61%`,
          "chart-2": `${(h + 72) % 360} 58% 39%`,
          "chart-3": `${(h + 144) % 360} 37% 24%`,
          "chart-4": `${(h + 216) % 360} 74% 66%`,
          "chart-5": `${(h + 288) % 360} 87% 67%`,
        }
      
        const dark: PaletteType = {
          background: `${h} 15% 10%`,
          foreground: `${h} 10% 98%`,
          card: `${h} 15% 10%`,
          "card-foreground": `${h} 10% 98%`,
          popover: `${h} 15% 10%`,
          "popover-foreground": `${h} 10% 98%`,
          primary: `${h} 80% 80%`,
          "primary-foreground": `${h} 15% 10%`,
          secondary: `${h} 20% 16%`,
          "secondary-foreground": `${h} 10% 98%`,
          muted: `${h} 20% 16%`,
          "muted-foreground": `${h} 10% 65%`,
          accent: `${h} 20% 16%`,
          "accent-foreground": `${h} 10% 98%`,
          destructive: "0 62% 30%",
          "destructive-foreground": `${h} 10% 98%`,
          border: `${h} 20% 16%`,
          input: `${h} 20% 16%`,
          ring: `${h} 10% 84%`,
          radius: "0.5rem",
          "chart-1": `${(h + 0) % 360} 70% 50%`,
          "chart-2": `${(h + 72) % 360} 60% 45%`,
          "chart-3": `${(h + 144) % 360} 80% 55%`,
          "chart-4": `${(h + 216) % 360} 65% 60%`,
          "chart-5": `${(h + 288) % 360} 75% 55%`,
        }
      
        return { light, dark }
      }
  
      const { light, dark } = generatePalettes(palette[0])
      useColorStore.getState().setPalette(light, dark)
    } catch (error) {
      console.error('Error extracting colors:', error)
      useColorStore.getState().resetPalette()
    }
  }

  // 在 useEffect 中監聽 currentSong 變化
  useEffect(() => {
    if (currentSong?.cover && useColorStore.getState().isDynamicColorEnabled) {
      extractColors(currentSong.cover)
    }
  }, [currentSong?.cover])

  // 監聽音量變化
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  return (
    <audio
      ref={audioRef}
      src={currentSong?.musicUrl}
      crossOrigin="anonymous"
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onSeeked={() => {
        if (audioRef.current) {
          setCurrentTime(Number(audioRef.current.currentTime.toFixed(3)))
        }
      }}
      onEnded={() => {
        setCurrentTime(0);
        if (currentSong && likedSongs.some(song => song.id === currentSong.id)) {
          void playNextSong();
        } else {
          setIsPlaying(false);
        }
        if (navigator.mediaSession) {
          navigator.mediaSession.setPositionState({ duration: 0, position: 0 });
        }
      }}
      // 修改 onError 事件，改用 handleAudioError 處理
      onError={handleAudioError}
    />
  )
}

export default AudioPlayer