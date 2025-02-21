import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GenreScore {
  id: string
  name: string
  score: number
  playCount: number
  totalPlayTime: number  // in seconds
  lastPlayed: number     // timestamp
}

interface ArtistScore {
  id: number
  name: string
  score: number
  playCount: number
  totalPlayTime: number
  lastPlayed: number
}

interface PersonalStore {
  genreScores: GenreScore[]
  artistScores: ArtistScore[]
  currentSessionStart: number | null
  currentGenreId: string | null
  currentArtistId: number | null
  updateGenreScore: (genreId: string, genreName: string, playTime: number) => void
  updateArtistScore: (artist: { id: number; name: string }, playTime: number) => void
  startPlaySession: (genreId: string) => void
  startArtistSession: (artistId: number) => void
  getTopGenres: (limit?: number) => GenreScore[]
  getTopArtists: (limit?: number) => ArtistScore[]
  getGenreScore: (genreId: string) => number
  getArtistScore: (artistId: number) => number
  resetScores: () => void
}

const PLAY_TIME_WEIGHT = 1.0    // Weight for play time contribution
const DECAY_RATE = 0.02         // Daily decay rate
const MINIMUM_PLAY_TIME = 30    // Minimum seconds required to count as a play
const MAX_SCORE = 10            // Maximum score for any genre
const MIN_SCORE_THRESHOLD = 0.1  // Minimum score to keep genre in list

export const usePersonalStore = create<PersonalStore>()(
  persist(
    (set, get) => ({
      genreScores: [],
      artistScores: [],
      currentSessionStart: null,
      currentGenreId: null,
      currentArtistId: null,

      updateGenreScore: (genreId: string, genreName: string, playTime: number) => {
        console.log(`Updating genre score: ${genreName} (${genreId}), playTime: ${playTime}s`)
        if (playTime < MINIMUM_PLAY_TIME) {
          console.log('Play time too short, ignoring update')
          return
        }

        set(state => {
          const now = Date.now()
          let genreScores = [...state.genreScores]
          
          // First apply time decay to all genres
          genreScores = genreScores.map(genre => {
            const daysSinceLastPlay = (now - genre.lastPlayed) / (1000 * 60 * 60 * 24)
            const decayedScore = genre.score * Math.pow(1 - DECAY_RATE, daysSinceLastPlay)
            return {
              ...genre,
              score: decayedScore
            }
          })

          // Handle current playing genre
          const genreIndex = genreScores.findIndex(g => g.id === genreId)
          const playTimeScore = playTime * PLAY_TIME_WEIGHT / 300 // Normalize to 5 minutes

          if (genreIndex === -1) {
            // New genre
            const initialScore = Math.min(playTimeScore, 3) // Max initial score is 3
            genreScores.push({
              id: genreId,
              name: genreName,
              score: initialScore,
              playCount: 1,
              totalPlayTime: playTime,
              lastPlayed: now
            })
          } else {
            // Update existing genre
            genreScores[genreIndex] = {
              ...genreScores[genreIndex],
              score: Math.min(
                genreScores[genreIndex].score + playTimeScore,
                MAX_SCORE
              ),
              playCount: genreScores[genreIndex].playCount + 1,
              totalPlayTime: genreScores[genreIndex].totalPlayTime + playTime,
              lastPlayed: now
            }
          }

          // Calculate total score and normalize
          const totalScore = genreScores.reduce((sum, genre) => sum + genre.score, 0)
          
          if (totalScore > 0) {
            // Normalize scores to make total = MAX_SCORE
            const normalizer = MAX_SCORE / totalScore
            genreScores = genreScores.map(genre => ({
              ...genre,
              score: genre.score * normalizer
            }))
          }

          // Remove genres with very low scores
          genreScores = genreScores.filter(genre => genre.score > MIN_SCORE_THRESHOLD)

          return { genreScores }
        })
      },

      updateArtistScore: (artist, playTime) => {
        console.log(`Updating artist score: ${artist.name} (${artist.id}), playTime: ${playTime}s`)
        if (playTime < MINIMUM_PLAY_TIME) {
          console.log('Play time too short, ignoring update')
          return
        }

        set(state => {
          const now = Date.now()
          let artistScores = [...state.artistScores]
          
          // Apply time decay to all artists
          artistScores = artistScores.map(artist => {
            const daysSinceLastPlay = (now - artist.lastPlayed) / (1000 * 60 * 60 * 24)
            const decayedScore = artist.score * Math.pow(1 - DECAY_RATE, daysSinceLastPlay)
            return {
              ...artist,
              score: decayedScore
            }
          })

          const artistIndex = artistScores.findIndex(a => a.id === artist.id)
          const playTimeScore = playTime * PLAY_TIME_WEIGHT / 300 // Normalize to 5 minutes

          if (artistIndex === -1) {
            // New artist
            const initialScore = Math.min(playTimeScore, 3)
            artistScores.push({
              id: artist.id,
              name: artist.name,
              score: initialScore,
              playCount: 1,
              totalPlayTime: playTime,
              lastPlayed: now
            })
          } else {
            // Update existing artist
            artistScores[artistIndex] = {
              ...artistScores[artistIndex],
              score: Math.min(
                artistScores[artistIndex].score + playTimeScore,
                MAX_SCORE
              ),
              playCount: artistScores[artistIndex].playCount + 1,
              totalPlayTime: artistScores[artistIndex].totalPlayTime + playTime,
              lastPlayed: now
            }
          }

          // Normalize scores
          const totalScore = artistScores.reduce((sum, artist) => sum + artist.score, 0)
          if (totalScore > 0) {
            artistScores = artistScores.map(artist => ({
              ...artist,
              score: (artist.score * MAX_SCORE) / totalScore
            }))
          }

          // Remove artists with very low scores
          artistScores = artistScores.filter(artist => artist.score > MIN_SCORE_THRESHOLD)

          return { artistScores }
        })
      },

      startPlaySession: (genreId: string) => {
        console.log(`Starting new play session for genre: ${genreId}`)
        set({
          currentSessionStart: Date.now(),
          currentGenreId: genreId
        })
      },

      startArtistSession: (artistId) => {
        console.log(`Starting new artist session for: ${artistId}`)
        set({ currentArtistId: artistId })
      },

      getTopGenres: (limit = 5) => {
        const { genreScores } = get()
        return [...genreScores]
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
      },

      getTopArtists: (limit = 5) => {
        const { artistScores } = get()
        return [...artistScores]
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
      },

      getGenreScore: (genreId: string) => {
        const { genreScores } = get()
        const genre = genreScores.find(g => g.id === genreId)
        return genre?.score ?? 0
      },

      getArtistScore: (artistId) => {
        const { artistScores } = get()
        const artist = artistScores.find(a => a.id === artistId)
        return artist?.score ?? 0
      },

      resetScores: () => {
        set({
          genreScores: [],
          artistScores: [],
          currentSessionStart: null,
          currentGenreId: null,
          currentArtistId: null
        })
      }
    }),
    {
      name: 'personal-storage'
    }
  )
)
