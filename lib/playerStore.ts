import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CurrentSong = {
  id: number
  name: string
  artists: Array<{ id: number; name: string }>
  album: {
    id: number
    name: string
    cover: string
  }
  musicUrl?: string
}

type LyricLine = {
  time: number
  text: string
}

type LikedSong = {
  id: number
  name: string
  artists: Array<{ id: number; name: string }>
  album: {
    id: number
    name: string
    cover: string
  }
}

type LikedAlbum = {
  id: number
  name: string
  artists: Array<{ id: number; name: string }>
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
  userInteracted: boolean
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
  volume: number
  isMuted: boolean
  setVolume: (volume: number) => void
  toggleMute: () => void
  setCurrentSong: (song: CurrentSong) => void
  updateCurrentSongDetails: (details: {
    artists: Array<{ id: number; name: string }>;
    album: { id: number; name: string; cover: string };
  }) => void
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
  setUserInteracted: (state: boolean) => void
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
      audioQuality: 2,
      isLiked: false,
      likedSongs: [],
      likedAlbums: [],
      analyserData: null,
      isLoading: false,
      userInteracted: false,
      currentAlbum: null,
      volume: 0.5,
      isMuted: false,
      setVolume: (volume) => set({ volume }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setUserInteracted: (state) => set({ userInteracted: state }),

      setCurrentSong: async (song) => {
        set({
          currentSong: {
            id: song.id,
            name: song.name,
            artists: [],
            album: { id: 0, name: '', cover: '' },
          },
          isPlaying: true,
          isLoading: true,
          userInteracted: true,
          lyrics: [],
          currentLyricIndex: -1
        })
      },

      updateCurrentSongDetails: (details) => set((state) => ({
        currentSong: state.currentSong ? {
          ...state.currentSong,
          artists: details.artists,
          album: details.album
        } : null
      })),

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
        likedSongs: [...state.likedSongs, {
          id: song.id,
          name: song.name,
          artists: typeof song.artists === 'string' 
            ? [{ id: 0, name: song.artists }]
            : song.artists,
          album: {
            id: song.album.id,
            name: song.album.name,
            cover: song.album.cover
          }
        }],
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
        likedAlbums: [...state.likedAlbums, {
          id: album.id,
          name: album.name,
          artists: typeof album.artists === 'string'
            ? [{ id: 0, name: album.artists }]
            : album.artists,
          cover: album.cover,
          songCount: album.songCount
        }]
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
            set({
              currentSong: {
                id: nextSong.id,
                name: nextSong.name,
                artists: [],
                album: { id: 0, name: '', cover: '' }
              }
            })
            return
          }
        }

        if (!currentSong) {
          if (likedSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * likedSongs.length)
            const song = likedSongs[randomIndex]
            set({
              currentSong: {
                id: song.id,
                name: song.name,
                artists: [],
                album: { id: 0, name: '', cover: song.album.cover }
              }
            })
          }
          return
        }

        const currentIndex = likedSongs.findIndex(song => song.id === currentSong.id)
        if (currentIndex === -1 || currentIndex === likedSongs.length - 1) {
          const randomIndex = Math.floor(Math.random() * likedSongs.length)
          const song = likedSongs[randomIndex]
          set({
            currentSong: {
              id: song.id,
              name: song.name,
              artists: [],
              album: { id: 0, name: '', cover: song.album.cover }
            }
          })
        } else {
          const nextSong = likedSongs[currentIndex + 1]
          set({
            currentSong: {
              id: nextSong.id,
              name: nextSong.name,
              artists: [],
              album: { id: 0, name: '', cover: nextSong.album.cover }
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
            set({
              currentSong: {
                id: previousSong.id,
                name: previousSong.name,
                artists: [],
                album: { id: 0, name: '', cover: '' }
              }
            })
            return
          }
        }

        if (!currentSong) {
          if (likedSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * likedSongs.length)
            const song = likedSongs[randomIndex]
            set({
              currentSong: {
                id: song.id,
                name: song.name,
                artists: [],
                album: { id: 0, name: '', cover: song.album.cover }
              }
            })
          }
          return
        }

        const currentIndex = likedSongs.findIndex(song => song.id === currentSong.id)
        if (currentIndex === -1 || currentIndex === 0) {
          const randomIndex = Math.floor(Math.random() * likedSongs.length)
          const song = likedSongs[randomIndex]
          set({
            currentSong: {
              id: song.id,
              name: song.name,
              artists: [],
              album: { id: 0, name: '', cover: song.album.cover }
            }
          })
        } else {
          const previousSong = likedSongs[currentIndex - 1]
          set({
            currentSong: {
              id: previousSong.id,
              name: previousSong.name,
              artists: [],
              album: { id: 0, name: '', cover: previousSong.album.cover }
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