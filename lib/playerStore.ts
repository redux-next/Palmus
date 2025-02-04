import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CurrentSong = {
  id: number
  name: string
  artists: string
  albumName: string
  cover: string
  musicUrl?: string
}

type LyricLine = {
  time: number
  text: string
}

type LikedSong = {
  id: number
  name: string
  artists: string
  cover: string
}

type LikedAlbum = {
  id: number
  name: string
  artists: string
  cover: string
  songCount: number
}

type CurrentAlbumSong = {
  id: number;
  name: string;
  artists: string;
  albumName: string;
  cover: string;
};

type PlayerStore = {
  currentSong: CurrentSong | null
  isPlaying: boolean
  duration: number
  currentTime: number
  lyrics: LyricLine[]
  currentLyricIndex: number
  audioQuality: number
  isLiked: boolean
  likedSongs: LikedSong[]
  likedAlbums: LikedAlbum[]
  analyserData: Uint8Array | null
  isLoading: boolean
  userInteracted: boolean  // 新增這個狀態
  currentAlbum: {
    id: number;
    songs: Array<{
      id: number;
      name: string;
      artists: string;
      albumName: string;
      cover: string;
    }>;
  } | null;
  setCurrentSong: (song: CurrentSong) => void
  setMusicUrl: (url: string) => void
  setIsPlaying: (state: boolean) => void
  setDuration: (time: number) => void
  setCurrentTime: (time: number) => void
  setLyrics: (lyrics: LyricLine[]) => void
  setCurrentLyricIndex: (index: number) => void
  setAudioQuality: (quality: number) => void
  setIsLiked: (isLiked: boolean) => void
  addLikedSong: (song: LikedSong) => void
  removeLikedSong: (id: number) => void
  isLikedSong: (id: number) => boolean
  reorderLikedSongs: (startIndex: number, endIndex: number) => void
  addLikedAlbum: (album: LikedAlbum) => void
  removeLikedAlbum: (id: number) => void
  isLikedAlbum: (id: number) => boolean
  reorderLikedAlbums: (startIndex: number, endIndex: number) => void
  playNextSong: () => void
  playPreviousSong: () => void
  setAnalyserData: (data: Uint8Array | null) => void
  setIsLoading: (state: boolean) => void
  setUserInteracted: (state: boolean) => void  // 新增這個方法
  setCurrentAlbum: (albumId: number, songs: CurrentAlbumSong[]) => void;
  clearCurrentAlbum: () => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentSong: null,
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      lyrics: [],
      currentLyricIndex: -1,
      audioQuality: 2, // 默認 320kbps
      isLiked: false,
      likedSongs: [],
      likedAlbums: [],
      analyserData: null,
      isLoading: false,
      userInteracted: false,  // 新增初始狀態
      currentAlbum: null,
      setUserInteracted: (state) => set({ userInteracted: state }),

      setCurrentSong: async (song) => {
        set({
          currentSong: {
            id: song.id,
            name: song.name,
            artists: song.artists,
            albumName: song.albumName,
            cover: song.cover,
          },
          isPlaying: true,  // 改為 true，這樣點擊歌曲後會自動播放
          isLoading: true,
          userInteracted: true,  // 設置為已互動
          lyrics: [], // 清空之前的歌詞
          currentLyricIndex: -1 // 重置歌詞索引
        })

        // 不在這裡獲取音樂 URL
      },
      setMusicUrl: (url) => set((state) => ({
        currentSong: state.currentSong ? { ...state.currentSong, musicUrl: url } : null,
        isLoading: false
      })),
      setIsPlaying: (state) => set({ isPlaying: state }),
      setDuration: (time) => set({ duration: time }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setLyrics: (lyrics) => set({
        lyrics: lyrics.map(line => ({
          ...line,
          text: line.text.replace(/&nbsp;/g, ' ')
        }))
      }),
      setCurrentLyricIndex: (index) => set({ currentLyricIndex: index }),
      setAudioQuality: (quality) => set({ audioQuality: quality }),
      setIsLiked: (isLiked) => set({ isLiked }),
      addLikedSong: (song) => set((state) => ({
        likedSongs: [...state.likedSongs, song],
        isLiked: true
      })),
      removeLikedSong: (id) => set((state) => ({
        likedSongs: state.likedSongs.filter((song) => song.id !== id),
        isLiked: false
      })),
      isLikedSong: (id) => {
        const state = get()
        return state.likedSongs.some((song) => song.id === id)
      },
      reorderLikedSongs: (startIndex, endIndex) => set((state) => {
        const items = [...state.likedSongs]
        const [reorderedItem] = items.splice(startIndex, 1)
        items.splice(endIndex, 0, reorderedItem)
        return { likedSongs: items }
      }),
      addLikedAlbum: (album) => set((state) => ({
        likedAlbums: [...state.likedAlbums, album]
      })),
      removeLikedAlbum: (id) => set((state) => ({
        likedAlbums: state.likedAlbums.filter((album) => album.id !== id)
      })),
      isLikedAlbum: (id) => {
        const state = get()
        return state.likedAlbums.some((album) => album.id === id)
      },
      reorderLikedAlbums: (startIndex, endIndex) => set((state) => {
        const items = [...state.likedAlbums]
        const [reorderedItem] = items.splice(startIndex, 1)
        items.splice(endIndex, 0, reorderedItem)
        return { likedAlbums: items }
      }),
      setCurrentAlbum: (albumId, songs) => set({
        currentAlbum: {
          id: albumId,
          songs: songs.map(song => ({
            id: song.id,
            name: song.name,
            artists: song.artists,
            albumName: song.albumName,
            cover: song.cover
          }))
        }
      }),
      clearCurrentAlbum: () => set({ currentAlbum: null }),

      playNextSong: () => {
        set({ isLoading: true })
        const state = get()
        const { currentSong, currentAlbum, likedSongs } = state

        if (currentAlbum && currentSong) {
          const currentIndex = currentAlbum.songs.findIndex(song => song.id === currentSong.id)
          if (currentIndex !== -1 && currentIndex < currentAlbum.songs.length - 1) {
            const nextSong = currentAlbum.songs[currentIndex + 1]
            set({ currentSong: nextSong })
            return
          }
        }

        // 如果不在專輯中或是專輯的最後一首，按原來的邏輯播放
        if (!currentSong) {
          // 如果沒有正在播放的歌曲，隨機播放一首
          if (likedSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * likedSongs.length)
            const song = likedSongs[randomIndex]
            set({
              currentSong: {
                id: song.id,
                name: song.name,
                artists: song.artists,
                albumName: '',
                cover: song.cover
              }
            })
          }
          return
        }

        // 查找當前歌曲在喜歡列表中的索引
        const currentIndex = likedSongs.findIndex(song => song.id === currentSong.id)

        if (currentIndex === -1 || currentIndex === likedSongs.length - 1) {
          // 如果不在列表中或是最後一首，隨機播放
          const randomIndex = Math.floor(Math.random() * likedSongs.length)
          const song = likedSongs[randomIndex]
          set({
            currentSong: {
              id: song.id,
              name: song.name,
              artists: song.artists,
              albumName: '',
              cover: song.cover
            }
          })
        } else {
          // 播放下一首
          const nextSong = likedSongs[currentIndex + 1]
          set({
            currentSong: {
              id: nextSong.id,
              name: nextSong.name,
              artists: nextSong.artists,
              albumName: '',
              cover: nextSong.cover
            }
          })
        }
      },

      playPreviousSong: () => {
        set({ isLoading: true })
        const state = get()
        const { currentSong, currentAlbum, likedSongs } = state

        if (currentAlbum && currentSong) {
          const currentIndex = currentAlbum.songs.findIndex(song => song.id === currentSong.id)
          if (currentIndex > 0) {
            const previousSong = currentAlbum.songs[currentIndex - 1]
            set({ currentSong: previousSong })
            return
          }
        }

        // 如果不在專輯中或是專輯的第一首，按原來的邏輯播放
        if (!currentSong) {
          if (likedSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * likedSongs.length)
            const song = likedSongs[randomIndex]
            set({
              currentSong: {
                id: song.id,
                name: song.name,
                artists: song.artists,
                albumName: '',
                cover: song.cover
              }
            })
          }
          return
        }

        const currentIndex = likedSongs.findIndex(song => song.id === currentSong.id)

        if (currentIndex === -1 || currentIndex === 0) {
          // 如果不在列表中或是第一首，隨機播放
          const randomIndex = Math.floor(Math.random() * likedSongs.length)
          const song = likedSongs[randomIndex]
          set({
            currentSong: {
              id: song.id,
              name: song.name,
              artists: song.artists,
              albumName: '',
              cover: song.cover
            }
          })
        } else {
          // 播放上一首
          const previousSong = likedSongs[currentIndex - 1]
          set({
            currentSong: {
              id: previousSong.id,
              name: previousSong.name,
              artists: previousSong.artists,
              albumName: '',
              cover: previousSong.cover
            }
          })
        }
      },
      setAnalyserData: (data) => set({ analyserData: data }),
      setIsLoading: (state) => set({ isLoading: state }),
    }),
    {
      name: 'player-storage',
    }
  )
)
