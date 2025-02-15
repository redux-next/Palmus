"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePlayerStore } from '@/lib/playerStore'
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

export default function Home() {
  const [charts, setCharts] = useState<ChartSection[]>([
    { title: "Billboard Top 30", songs: [], loading: true },
    { title: "UK Top 30", songs: [], loading: true },
    { title: "Beatport Top 30", songs: [], loading: true },
  ])
  const [topArtists, setTopArtists] = useState<Artist[]>([])
  const [artistsLoading, setArtistsLoading] = useState(true)

  const { setCurrentSong } = usePlayerStore()
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
      artists: songArtists,
      albumName,
      cover: songCover
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
          { title: "Billboard Top 30", songs: billboardData.songs || [], loading: false },
          { title: "UK top 30", songs: ukData.songs || [], loading: false },
          { title: "Beatport Top 30", songs: beatportData.songs || [], loading: false },
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Discover</h1>
      
      {/* Charts Sections */}
      {charts.map((chart, index) => (
        <section key={index} className="space-y-4">
          <h2 className="text-xl font-semibold">{chart.title}</h2>
          <ScrollArea>
            {chart.loading ? (
              // 載入中的骨架屏
              <div className="flex gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
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
                    // 新增 data attributes
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
    </div>
  )
}
