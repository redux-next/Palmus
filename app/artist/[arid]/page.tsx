"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlayerStore } from "@/lib/playerStore"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"

type Album = {
  id: number
  name: string
  picUrl: string
  artist: { id: number; name: string }
  publishTime: number
  size: number
  type: string
}

type Artist = {
  name: string
  cover: string
  avatar: string
  briefDesc: string
  alias: string[]
  transNames: string[]
  signature?: string | null  // 新增 signature 欄位
}

type Song = {
  id: number
  name: string
  ar: { id: number; name: string }[]
  al: { picUrl: string; name: string }
}

const getTranslatedType = (type: string) => {
  if (type === "专辑") return "Album"
  return type
}

export default function ArtistPage() {
  const params = useParams()
  const [artist, setArtist] = useState<Artist | null>(null)
  const [topSongs, setTopSongs] = useState<Song[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { setCurrentSong } = usePlayerStore()

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        const [artistResponse, popularResponse, albumsResponse] = await Promise.all([
          fetch(`/api/artist?id=${params.arid}`),
          fetch(`/api/artist/popular?id=${params.arid}`),
          fetch(`/api/artist/album/list?id=${params.arid}`)
        ])

        const artistData = await artistResponse.json()
        const popularData = await popularResponse.json()
        const albumsData = await albumsResponse.json()

        if (artistData.code === 200) {
          setArtist({
            name: artistData.data.artist.name,
            cover: artistData.data.artist.cover,
            avatar: artistData.data.artist.avatar,
            briefDesc: artistData.data.artist.briefDesc,
            alias: artistData.data.artist.alias,
            transNames: artistData.data.artist.transNames,
            signature: artistData.data.user?.signature || null  // 取得 signature
          })
        }
        setTopSongs(popularData.songs || [])
        setAlbums(albumsData.hotAlbums || [])
      } catch (error) {
        console.error('Error fetching artist data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.arid) {
      void fetchArtistData()
    }
  }, [params.arid])

  const handleSongClick = (song: Song) => {
    setCurrentSong({
      id: song.id,
      name: song.name,
      artists: song.ar.map(artist => artist.name).join('/'),
      albumName: song.al.name,
      cover: song.al.picUrl
    })
  }

  if (isLoading) {
    return (
      <div>
        <div className="relative h-[40vh]">
          <Skeleton className="w-full h-full rounded-t-2xl" />
          <div className="absolute bottom-0 p-6 bg-gradient-to-t from-background to-transparent w-full">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <h2 className="text-xl font-semibold m-4">Popular</h2>
        <div className="space-y-2">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="flex items-center space-x-4 p-4">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mx-4 mt-8">
          <h2 className="text-xl font-semibold">Albums</h2>
          <Skeleton className="h-9 w-24" />
        </div>
        <ScrollArea>
          <div className="flex gap-4 px-4 mt-4">
            {[...Array(30)].map((_, index) => (
              <div key={index} className="shrink-0 w-[200px]">
                <Skeleton className="w-[200px] h-[200px] rounded-lg" />
                <Skeleton className="h-4 w-36 mt-2" />
                <Skeleton className="h-3 w-24 mt-2" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  if (!artist) return null

  return (
    <div>
      <div className="relative h-[40vh]">
        <img 
          src={artist.cover} 
          alt={artist.name}
          className="w-full h-full object-cover rounded-t-2xl"
        />
        <div className="absolute bottom-0 p-6 bg-gradient-to-t from-background to-transparent w-full">
          <h1 className="text-4xl font-bold">{artist.name}</h1>
          {artist.signature && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              &quot;{artist.signature}&quot;
            </p>
          )}
        </div>
      </div>
      
      <h2 className="text-xl font-semibold m-4">Popular</h2>
      <div className="space-y-2 mb-8">
        {topSongs.slice(0, 10).map((song) => (
          <div 
            key={song.id}
            className="flex items-center space-x-4 p-4 rounded-xl hover:bg-accent/50 cursor-pointer"
            onClick={() => handleSongClick(song)}
          >
            <img
              src={song.al.picUrl + "?param=100y100"}
              alt={song.name}
              className="w-12 h-12 rounded-lg"
            />
            <div>
              <p className="font-medium">{song.name}</p>
              <p className="text-sm text-muted-foreground">
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
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center mx-4">
          <h2 className="text-xl font-semibold">Albums</h2>
          <Link
            href={`/artist/${params.arid}/album`}
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            See More
          </Link>
        </div>
        <ScrollArea>
          <div className="flex gap-4 px-4">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/artist/${params.arid}/album/${album.id}`}
                className="bg-card text-card-foreground p-4 rounded-2xl shadow border shrink-0 w-[200px] hover:bg-accent/50 transition-colors"
              >
                <div className="aspect-square">
                  <img
                    src={album.picUrl + "?param=200y200"}
                    alt={album.name}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-medium mt-2 truncate">{album.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(album.publishTime).getFullYear()}
                  {album.type && ` · ${getTranslatedType(album.type)}`}
                </p>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </section>
    </div>
  )
}
