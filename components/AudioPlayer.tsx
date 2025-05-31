"use client"

import { useEffect, useRef, useCallback, useState } from 'react'
import { usePlayerStore, type YRCLine, type LyricLine } from '@/lib/playerStore'
import ColorThief from 'colorthief'
import { useColorStore } from '@/lib/colorStore'
import { usePersonalStore } from '@/lib/personalStore'
import { parseLRC, parseYRC } from 'native-lyrics-tools'

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

const paletteCache = new Map<string, { light: PaletteType; dark: PaletteType }>()

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastUpdateRef = useRef(0)
  const [detailFetched, setDetailFetched] = useState(false)
  
  const { 
    currentSong, 
    isPlaying,
    isLoading,
    userInteracted,
    setUserInteracted,
    setIsPlaying,    setCurrentTime, 
    setDuration,
    lrc,
    yrc,
    setCurrentLyricIndex,
    audioQuality,
    setMusicUrl,
    playNextSong,
    playPreviousSong,
    likedSongs,
    setIsLoading,
    setLrc,
    setYrc,
    setTlyric,
    updateCurrentSongDetails
  } = usePlayerStore()

  const volume = usePlayerStore((state) => state.volume)
  const isMuted = usePlayerStore((state) => state.isMuted)

  const {
    updateGenreScore,
    updateArtistScore,
    currentSessionStart,
    startPlaySession,
    startArtistSession
  } = usePersonalStore()

  const [currentGenre, setCurrentGenre] = useState<{ id: string; name: string } | null>(null)

  // Fetch detailed song information when song changes
  useEffect(() => {
    const fetchDetails = async () => {
      if (!currentSong?.id || detailFetched) return
      
      try {
        const [detailRes, genreRes] = await Promise.all([
          fetch(`/api/detail?id=${currentSong.id}`),
          fetch(`/api/genre/song?id=${currentSong.id}`)
        ]);
        
        const detailData = await detailRes.json();
        const genreData = await genreRes.json();
        
        if (detailData.code === 200 && detailData.songs?.length > 0) {
          const songData = detailData.songs[0]
          const artists = songData.ar.map((ar: { id: number; name: string }) => ({
            id: ar.id,
            name: ar.name
          }))
          const album = {
            id: songData.al.id,
            name: songData.al.name,
            cover: songData.al.picUrl
          }
          updateCurrentSongDetails({ artists, album })
          
          // 處理流派資訊
          if (genreData && genreData.genre) {
            setCurrentGenre({
              id: genreData.genre.id.toString(),
              name: genreData.genre.name
            })
            startPlaySession(genreData.genre.id.toString())
          }

          // 開始追踪主要藝術家的播放數據
          if (artists.length > 0) {
            const mainArtist = artists[0]
            startArtistSession(mainArtist.id)
          }
          
          setDetailFetched(true)
        }
      } catch (error) {
        console.error('Failed to fetch song details or genre:', error)
      }
    }

    fetchDetails()
  }, [currentSong?.id, updateCurrentSongDetails, detailFetched, startPlaySession, startArtistSession])

  // Reset detail fetched state when song changes
  useEffect(() => {
    setDetailFetched(false)
  }, [currentSong?.id])

  // Reset genre information when song changes
  useEffect(() => {
    setCurrentGenre(null)
  }, [currentSong?.id])

  // Media Session initialization
  const initializeMediaSession = useCallback(() => {
    if (!('mediaSession' in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong?.name || 'Unknown Track',
      artist: currentSong?.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
      album: currentSong?.album?.name || 'Unknown Album',
      artwork: [
        { 
          src: currentSong?.album?.cover || '/placeholder.svg', 
          sizes: '512x512', 
          type: 'image/jpeg' 
        }
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
        console.error('Error setting media action:', error)
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
  }, [isPlaying, setIsPlaying])  // 初始化 OpenCC 轉換器（簡體轉繁體）
  const converter = useRef<((text: string) => string) | null>(null)
  const [openCCReady, setOpenCCReady] = useState(false)
  
  useEffect(() => {
    // 動態導入 OpenCC 轉換器
    const initOpenCC = async () => {
      try {
        // 檢查是否在瀏覽器環境
        if (typeof window === 'undefined') return
        
        const OpenCC = await import('opencc-js')
        if (OpenCC && OpenCC.Converter) {
          converter.current = OpenCC.Converter({ from: 'cn', to: 'tw' })
          setOpenCCReady(true)
          console.log('OpenCC 初始化成功')
        } else {
          console.warn('OpenCC.Converter 不可用')
        }
      } catch (error) {
        console.error('OpenCC 初始化失敗:', error)
        converter.current = null
        setOpenCCReady(false)
      }
    }
    
    initOpenCC()
  }, [])

  // 轉換中文文本為繁體中文
  const convertToTraditional = useCallback((text: string): string => {
    if (!openCCReady || !converter.current || !text) return text
    try {
      return converter.current(text)
    } catch (error) {
      console.error('OpenCC 轉換失敗:', error)
      return text
    }
  }, [openCCReady])

  // 轉換歌詞行
  const convertLyricLines = useCallback((lines: LyricLine[]): LyricLine[] => {
    if (!openCCReady) return lines
    
    return lines.map(line => ({
      ...line,
      words: line.words.map(word => ({
        ...word,
        word: convertToTraditional(word.word)
      }))
    }))
  }, [convertToTraditional, openCCReady])

  // 轉換 YRC 歌詞行
  const convertYRCLines = useCallback((lines: YRCLine[]): YRCLine[] => {
    if (!openCCReady) return lines
    
    return lines.map(line => ({
      ...line,
      words: line.words.map(word => ({
        ...word,
        word: convertToTraditional(word.word)
      }))
    }))
  }, [convertToTraditional, openCCReady])

  // 檢查歌詞是否只包含元數據或無效內容
  const isValidLyrics = useCallback((lyrics: LyricLine[]): boolean => {
    if (!lyrics || lyrics.length === 0) return false;
    
    // 檢查是否有任何有效的歌詞內容
    for (const line of lyrics) {
      if (line.words && line.words.length > 0) {
        for (const word of line.words) {
          const content = word.word?.trim();
          if (content && content.length > 0) {
            // 檢查是否不是純元數據
            try {
              const parsed = JSON.parse(content);              // 如果能解析為 JSON 且包含元數據格式，跳過
              if (parsed && typeof parsed === 'object' && 'c' in parsed) {
                continue;
              }
            } catch {
              // 不是 JSON，視為有效歌詞
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }, [])

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
            
            let lyricsSet = false
            
            // 嘗試從新的統一歌詞 API 獲取所有歌詞類型
            try {
              const lyricsResponse = await fetch(`/api/lyrics?id=${currentSong.id}`)
              if (lyricsResponse.ok) {
                const lyricsData = await lyricsResponse.json()
                
                // 處理 YRC 歌詞（如果存在）
                if (lyricsData.yrc?.lyric) {
                  try {
                    const parsedYrc = parseYRC(lyricsData.yrc.lyric)
                    const convertedYrc = openCCReady ? convertYRCLines(parsedYrc) : parsedYrc
                    setYrc(convertedYrc)
                    console.log(`使用 parseYRC 解析歌詞${openCCReady ? '並轉換為繁體中文' : ''}，共`, convertedYrc.length, '行')
                  } catch (err) {
                    console.error('parseYRC 解析失敗:', err)
                    setYrc([])
                  }
                } else {
                  setYrc([])
                }

                // 處理翻譯歌詞（如果存在）
                if (lyricsData.tlyric?.lyric) {
                  try {
                    const parsedTlyric = parseLRC(lyricsData.tlyric.lyric)
                    const convertedTlyric = openCCReady ? convertLyricLines(parsedTlyric) : parsedTlyric
                    setTlyric(convertedTlyric)
                    console.log(`解析翻譯歌詞${openCCReady ? '並轉換為繁體中文' : ''}，共`, convertedTlyric.length, '行')
                  } catch (err) {
                    console.error('翻譯歌詞解析失敗:', err)
                    setTlyric([])
                  }
                } else {
                  setTlyric([])
                }

                // 處理 LRC 歌詞（必需）
                if (lyricsData.lrc?.lyric) {
                  try {
                    const parsedLrc = parseLRC(lyricsData.lrc.lyric)
                    const convertedLrc = openCCReady ? convertLyricLines(parsedLrc) : parsedLrc
                    
                    // 檢查歌詞是否有效
                    if (isValidLyrics(convertedLrc)) {
                      setLrc(convertedLrc)
                      lyricsSet = true
                      console.log(`使用統一API解析LRC歌詞${openCCReady ? '並轉換為繁體中文' : ''}，共`, convertedLrc.length, '行')
                    } else {
                      console.log('統一API的LRC歌詞無效或只包含元數據')
                      setLrc([])
                    }
                  } catch (err) {
                    console.error('統一API LRC解析失敗:', err)
                    setLrc([])
                  }
                } else {
                  setLrc([])
                }
              }
            } catch (lyricsError) {
              console.error('獲取統一歌詞API失敗:', lyricsError)
            }

            // 如果統一API沒有有效的LRC歌詞，嘗試從播放API獲取
            if (!lyricsSet && data.lrc && data.lrc.trim()) {
              try {
                const parsed = parseLRC(data.lrc)
                const convertedLrc = openCCReady ? convertLyricLines(parsed) : parsed
                
                // 檢查歌詞是否有效
                if (isValidLyrics(convertedLrc)) {
                  setLrc(convertedLrc)
                  lyricsSet = true
                  console.log(`使用播放API解析LRC歌詞${openCCReady ? '並轉換為繁體中文' : ''}，共`, convertedLrc.length, '行')
                } else {
                  console.log('播放API的LRC歌詞無效或只包含元數據')
                  setLrc([])
                }
              } catch (err) {
                console.error('播放API LRC解析失敗:', err)
                setLrc([])
              }
            }
            
            // 最後嘗試 LRCLib API（必需有歌詞）
            if (!lyricsSet) {
              console.log('前面的歌詞來源都沒有有效結果，嘗試使用 LRCLib API')
              
              if (currentSong?.name && currentSong?.artists?.[0]?.name) {
                try {
                  const albumName = currentSong?.album?.name || ''
                  const duration = Math.floor(data.duration || 0)
                  
                  const lrclibResponse = await fetch(
                    `/api/lyrics/lrclib?title=${encodeURIComponent(currentSong.name)}&artist=${encodeURIComponent(currentSong.artists[0].name)}&album=${encodeURIComponent(albumName)}&duration=${duration}`
                  )
                  
                  if (lrclibResponse.ok) {
                    const lrclibData = await lrclibResponse.json()
                    
                    if (lrclibData.instrumental) {
                      // 顯示純音樂標示，但不設置為找不到歌詞
                      setLrc([])
                      lyricsSet = true
                      console.log('設置純音樂標示')
                    } else if (lrclibData.syncedLyrics) {
                      try {
                        const parsed = parseLRC(lrclibData.syncedLyrics)
                        const convertedLrc = openCCReady ? convertLyricLines(parsed) : parsed
                        setLrc(convertedLrc)
                        lyricsSet = true
                        console.log(`使用LRCLib API解析歌詞${openCCReady ? '並轉換為繁體中文' : ''}，共`, convertedLrc.length, '行')
                      } catch (err) {
                        console.error('LRCLib API歌詞解析失敗:', err)
                        setLrc([])
                      }
                    }
                  }
                } catch (lrclibError) {
                  console.error('獲取LRCLib API失敗:', lrclibError)
                }
              }
            }

            // 如果所有方式都無法獲取歌詞，設置錯誤狀態
            if (!lyricsSet) {
              setLrc([{ 
                start_time: 0, 
                end_time: 999999999, 
                words: [{ 
                  start_time: 0, 
                  end_time: 999999999, 
                  word: "We can't find the lyrics :(" 
                }] 
              }])
              console.log('無法獲取有效歌詞，顯示錯誤訊息')
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
  }, [currentSong?.id, currentSong?.name, currentSong?.artists, audioQuality, userInteracted, setLrc, setYrc, setTlyric, setIsLoading, setMusicUrl, convertLyricLines, convertYRCLines, openCCReady, isValidLyrics])

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

  // 優化 handleTimeUpdate：使用 YRC 或 LRC 歌詞
  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return
    const current = Number(audioRef.current.currentTime.toFixed(3))
    if (Math.abs(current - lastUpdateRef.current) < 0.2) return
    lastUpdateRef.current = current
    setCurrentTime(current)
    
    // 暫時只使用 LRC 歌詞來確保一致性
    const currentLyrics = lrc
    if (currentLyrics.length === 0) return
  
    // 將時間轉換為毫秒以匹配歌詞格式
    const currentMs = current * 1000
    
    let low = 0
    let high = currentLyrics.length - 1
    let result = -1
  
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const startTime = (currentLyrics[mid] as LyricLine).start_time
      if (startTime <= currentMs) {
        result = mid
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    if (result !== -1) {
      const nextLyric = currentLyrics[result + 1]
      if (!nextLyric) {
        setCurrentLyricIndex(result)
      } else {
        const nextStartTime = (nextLyric as LyricLine).start_time
        if (currentMs < nextStartTime) {
          setCurrentLyricIndex(result)
        }
      }
    }

    // 處理流派和藝術家評分 - 進一步優化更新邏輯
    if (!currentSessionStart) return;
    
    // 獲取播放時間
    const playTime = Math.floor((Date.now() - currentSessionStart) / 1000)
    
    // 固定更新間隔：30秒時立即更新一次，之後每10秒更新一次
    if (playTime === 30 || (playTime > 30 && playTime % 10 === 0)) {
      // 流派評分更新
      if (currentGenre) {
        updateGenreScore(currentGenre.id, currentGenre.name, playTime)
      }
      
      // 藝術家評分更新
      if (currentSong?.artists?.[0]) {
        const mainArtist = currentSong.artists[0]
        updateArtistScore(mainArtist, playTime)
      }
    }
  }, [lrc, yrc, setCurrentTime, setCurrentLyricIndex, currentGenre, currentSessionStart, updateGenreScore, updateArtistScore, currentSong])
  
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

  // 修改 extractColors，加入快取機制
  const extractColors = async (imageUrl: string) => {
    try {
      // 檢查快取
      if (paletteCache.has(imageUrl)) {
        const { light, dark } = paletteCache.get(imageUrl)!
        useColorStore.getState().setPalette(light, dark)
        return
      }
  
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.src = imageUrl
  
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
  
      const colorThief = new ColorThief()
      const palette = colorThief.getPalette(img, 5)
  
      // 將 RGB 轉換為 HSL
      const toHSL = (rgb: number[]) => {
        const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255
        const max = Math.max(r, g, b), min = Math.min(r, g, b)
        let h = 0, s
        const l = (max + min) / 2
        if (max === min) { h = s = 0 }
        else {
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
          background: `${h} 45% 97%`,
          foreground: `${h} 45% 15%`,
          card: `${h} 40% 99%`,
          "card-foreground": `${h} 45% 15%`,
          popover: `${h} 40% 99%`,
          "popover-foreground": `${h} 45% 15%`,
          primary: `${h} 70% 45%`,
          "primary-foreground": `${h} 15% 98%`,
          secondary: `${h} 45% 94%`,
          "secondary-foreground": `${h} 45% 15%`,
          muted: `${h} 45% 94%`,
          "muted-foreground": `${h} 45% 40%`,  
          accent: `${h} 45% 94%`,
          "accent-foreground": `${h} 45% 15%`,
          destructive: "0 84% 60%",
          "destructive-foreground": `${h} 15% 98%`,
          border: `${h} 45% 85%`,
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
      // 儲存到快取
      paletteCache.set(imageUrl, { light, dark })
      useColorStore.getState().setPalette(light, dark)
    } catch (error) {
      console.error('Error extracting colors:', error)
      useColorStore.getState().resetPalette()
    }
  }

  // 在 useEffect 中監聽 currentSong 變化
  useEffect(() => {
    if (currentSong?.album?.cover && useColorStore.getState().isDynamicColorEnabled) {
      extractColors(currentSong.album.cover)
    }
  }, [currentSong?.album?.cover])

  // 新增的 useEffect，用來監聽 currentSong 變化：
  useEffect(() => {
    if (currentSong) {
      console.log("Playing", currentSong.id);
    }
  }, [currentSong]);

  // 監聽音量變化
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // 修改 onEnded 事件處理，確保結束時也更新兩種評分
  const handleEnded = useCallback(() => {
    setCurrentTime(0)
    
    // 在歌曲結束時更新最後的播放時間和評分
    if (currentSessionStart) {
      const totalPlayTime = Math.floor((Date.now() - currentSessionStart) / 1000)
      
      // 更新流派評分
      if (currentGenre) {
        updateGenreScore(currentGenre.id, currentGenre.name, totalPlayTime)
        console.log(`歌曲結束時更新流派評分: ${currentGenre.name}, 總播放時間: ${totalPlayTime}秒`)
      }
      
      // 更新藝術家評分
      if (currentSong?.artists?.[0]) {
        const mainArtist = currentSong.artists[0]
        updateArtistScore(mainArtist, totalPlayTime)
        console.log(`歌曲結束時更新藝術家評分: ${mainArtist.name}, 總播放時間: ${totalPlayTime}秒`)
      }
    }
    
    if (currentSong && likedSongs.some(song => song.id === currentSong.id)) {
      void playNextSong()
    } else {
      setIsPlaying(false)
    }
    
    if (navigator.mediaSession) {
      navigator.mediaSession.setPositionState({ duration: 0, position: 0 })
    }
  }, [currentGenre, currentSessionStart, updateGenreScore, currentSong, likedSongs, playNextSong, setIsPlaying, setCurrentTime, updateArtistScore])

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
      onEnded={handleEnded}
      onError={handleAudioError}
    />
  )
}

export default AudioPlayer