"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePlayerStore } from '@/lib/playerStore'
import { usePersonalStore } from '@/lib/personalStore'
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

type Song = {
  id: number
  name: string
  ar: { id: number; name: string }[]
  al: { picUrl: string; name: string }
}

type ChartSection = {
  title: string
  songs: Song[]
  loading: boolean
}

type Artist = {
  name: string
  id: number
  img1v1Url: string
  trans?: string
  albumSize: number
}

type PersonalizedSection = {
  title: string
  type: 'artist' | 'genre'
  id: string | number
  name: string
  songs: Song[]
  loading: boolean
}

export default function Home() {
  const [charts, setCharts] = useState<ChartSection[]>([
    { title: "Billboard Top 50", songs: [], loading: true },
    { title: "UK Top 50", songs: [], loading: true },
    { title: "Beatport Top 50", songs: [], loading: true },
  ])
  const [topArtists, setTopArtists] = useState<Artist[]>([])
  const [artistsLoading, setArtistsLoading] = useState(true)
  const [personalizedSections, setPersonalizedSections] = useState<PersonalizedSection[]>([])

  const { setCurrentSong } = usePlayerStore()
  const { getTopArtists, getTopGenres } = usePersonalStore()

  // 移除不需要的 store 方法

  // 新增事件委派處理器
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = (e.target as HTMLElement).closest("[data-song-id]")
    if (!card) return
    const songId = Number(card.getAttribute("data-song-id"))
    const songName = card.getAttribute("data-song-name") || ""
    const songArtists = card.getAttribute("data-song-artists") || ""
    const albumName = card.getAttribute("data-album-name") || ""
    const songCover = card.getAttribute("data-song-cover") || ""

    setCurrentSong({
      id: songId,
      name: songName,
      artists: [{
        id: 0,  // 這裡可能需要從 API 獲取完整的藝術家資訊
        name: songArtists
      }],
      album: {
        id: 0,  // 這裡可能需要從 API 獲取完整的專輯資訊
        name: albumName,
        cover: songCover
      }
    })
  }

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        // 使用新的代理 API 端點
        const [billboardData, ukData, beatportData] = await Promise.all([
          fetch('/api/playlist?id=60198&limit=50').then(res => res.json()),
          fetch('/api/playlist?id=180106&limit=50').then(res => res.json()),
          fetch('/api/playlist?id=3812895&limit=50').then(res => res.json())
        ])

        setCharts([
          { title: "Billboard Top 50", songs: billboardData.songs || [], loading: false },
          { title: "UK top 50", songs: ukData.songs || [], loading: false },
          { title: "Beatport Top 50", songs: beatportData.songs || [], loading: false },
        ])
      } catch (error) {
        console.error('Error fetching charts:', error)
      }
    }

    fetchCharts()
  }, [])

  useEffect(() => {
    const fetchTopArtists = async () => {
      try {
        const response = await fetch('/api/artist/top')
        const data = await response.json()
        if (data.code === 200 && data.list?.artists) {
          setTopArtists(data.list.artists)
        }
      } catch (error) {
        console.error('Error fetching top artists:', error)
      } finally {
        setArtistsLoading(false)
      }
    }

    fetchTopArtists()
  }, [])

  // 獲取個人化推薦
  useEffect(() => {
    const fetchPersonalizedContent = async () => {
      const sections: PersonalizedSection[] = []

      // 獲取前 3 個最常聽的藝術家
      const topArtists = getTopArtists(3)
      // 獲取前 2 個最常聽的流派
      const topGenres = getTopGenres(2)

      // 為每個藝術家獲取熱門歌曲
      for (const artist of topArtists) {
        sections.push({
          title: `Top picks from ${artist.name}`,
          type: 'artist',
          id: artist.id,
          name: artist.name,
          songs: [],
          loading: true
        })
      }

      // 為每個流派獲取歌曲
      for (const genre of topGenres) {
        sections.push({
          title: `More ${genre.name} for you`,
          type: 'genre',
          id: genre.id,
          name: genre.name,
          songs: [],
          loading: true
        })
      }

      setPersonalizedSections(sections)

      // 獲取每個部分的歌曲
      const updatedSections = await Promise.all(
        sections.map(async (section) => {
          try {
            const endpoint = section.type === 'artist'
              ? `/api/artist/popular?id=${section.id}`
              : `/api/genre/list?id=${section.id}&type=song`

            const response = await fetch(endpoint)
            const data = await response.json()

            return {
              ...section,
              songs: section.type === 'artist'
                ? data.songs || []
                : data.data?.songs || [],
              loading: false
            }
          } catch (error) {
            console.error(`Error fetching ${section.type} songs:`, error)
            return { ...section, loading: false }
          }
        })
      )

      setPersonalizedSections(updatedSections.filter(section => section.songs.length > 0))
    }

    fetchPersonalizedContent()
  }, [getTopArtists, getTopGenres])

  // 新增一個函數來檢查是否有個人化數據
  const hasPersonalizedData = personalizedSections.length > 0

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Discover</h1>

      {/* 個人化推薦部分 */}
      {hasPersonalizedData ? (
        <div className="space-y-8">
          {personalizedSections.map((section) => (
            <section key={`${section.type}-${section.id}`} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  {section.type === 'artist' 
                    ? <>Top picks from <Link className="text-primary font-bold hover:underline" href={`/artist/${section.id}`}>{section.name}</Link></>
                    : <>More <Link className="text-primary font-bold hover:underline" href={`/genre/${section.id}`}>{section.name}</Link> for you</>
                  }
                </h3>
              </div>
              <ScrollArea>
                {section.loading ? (
                  <div className="flex gap-4">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="shrink-0 w-[200px]">
                        <Skeleton className="aspect-square rounded-xl" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                        <Skeleton className="h-3 w-1/2 mt-1" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-4" onClick={handleContainerClick}>
                    {section.songs.map((song) => (
                      <div
                        key={song.id}
                        className="bg-card text-card-foreground p-4 rounded-2xl shadow border shrink-0 w-[200px] cursor-pointer hover:bg-accent/50 transition-colors"
                        data-song-id={song.id}
                        data-song-name={song.name}
                        data-song-artists={song.ar.map(artist => artist.name).join('/')}
                        data-album-name={song.al.name}
                        data-song-cover={song.al.picUrl}
                      >
                        <div className="aspect-square">
                          <img
                            src={song.al.picUrl + "?param=200y200"}
                            alt={song.name}
                            className="w-full h-full object-cover rounded-lg"
                            loading="lazy"
                          />
                        </div>
                        <h3 className="font-medium mt-2 truncate">{song.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {song.ar.map((artist, index) => (
                            <span key={artist.id}>
                              {index > 0 && " / "}
                              <Link
                                href={`/artist/${artist.id}`}
                                className="hover:underline hover:text-primary"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {artist.name}
                              </Link>
                            </span>
                          ))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </section>
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-8">
          <div className="relative z-10 max-w-2xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground/90">
              Get Your Personal Music Recommendations
            </h2>
            <p className="text-lg text-muted-foreground">
              Start exploring and listening to music you love. We&apos;ll analyze your taste to create perfect playlists just for you.
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link 
                href="/search" 
                className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Discover Music
              </Link>
            </div>
          </div>
          <div className="absolute inset-0 bg-grid-white/5" />
        </div>
      )}

      {/* Charts Sections */}
      {charts.map((chart, index) => (
        <section key={index} className="space-y-4">
          <h2 className="text-xl font-semibold">{chart.title}</h2>
          <ScrollArea>
            {chart.loading ? (
              <div className="flex gap-4">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="shrink-0 w-[200px]">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                    <Skeleton className="h-3 w-1/2 mt-1" />
                  </div>
                ))}
              </div>
            ) : (
              // 於容器上使用事件委派
              <div className="flex gap-4" onClick={handleContainerClick}>
                {chart.songs.map((song) => (
                  <div
                    key={song.id}
                    className="bg-card text-card-foreground p-4 rounded-2xl shadow border shrink-0 w-[200px] cursor-pointer hover:bg-accent/50 transition-colors"
                    data-song-id={song.id}
                    data-song-name={song.name}
                    data-song-artists={song.ar.map(artist => artist.name).join('/')}
                    data-album-name={song.al.name}
                    data-song-cover={song.al.picUrl}
                  >
                    <div className="aspect-square">
                      <img
                        src={song.al.picUrl + "?param=200y200"}
                        alt={song.name}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="font-medium mt-2 truncate">{song.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {song.ar.map((artist, index) => (
                        <span key={artist.id}>
                          {index > 0 && " / "}
                          <Link
                            href={`/artist/${artist.id}`}
                            className="hover:underline hover:text-primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {artist.name}
                          </Link>
                        </span>
                      ))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </section>
      ))}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Popular Artists</h2>
        <ScrollArea>
          {artistsLoading ? (
            <div className="flex gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[150px]">
                  <Skeleton className="w-[150px] h-[150px] rounded-full" />
                  <Skeleton className="h-4 w-3/4 mt-2 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4">
              {topArtists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  className="shrink-0 w-[150px] text-center"
                >
                  <div className="relative aspect-square overflow-hidden rounded-full">
                    <img
                      src={artist.img1v1Url + "?param=300y300"}
                      alt={artist.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-medium mt-2 truncate">
                    {artist.name}
                  </h3>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </section>
      <center><b><h3>DEVELOPED BY GYANAM & KESHAV</h3></b></center>
    </div>
  )
}
