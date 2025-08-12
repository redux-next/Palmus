"use client"

import { useParams } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

type Album = {
  id: number
  name: string
  picUrl: string
  publishTime: number
  size: number
  type: string
  subType: string
}

type Artist = {
  name: string
  id: number
  picUrl: string
  albumSize: number
}

const getTranslatedType = (type: string) => {
    if (type === "专辑") return "Album"
    return type
}

export default function AlbumListPage() {
  const params = useParams()
  const artistId = params?.arid as string
  const [albums, setAlbums] = useState<Album[]>([])
  const [artist, setArtist] = useState<Artist | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const limit = 30

  const observer = useRef<IntersectionObserver | null>(null)
  const lastAlbumRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setOffset(prevOffset => prevOffset + limit)
      }
    })
    if (node) observer.current.observe(node)
  }, [isLoading, hasMore])

  const fetchAlbums = async () => {
    if (!artistId || isLoading) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/artist/album/list?id=${artistId}&limit=${limit}&offset=${offset}`)
      const data = await response.json()
      
      // 確保 data 和必要的屬性存在
      if (data && data.artist && offset === 0) {
        setArtist({
          name: data.artist.name || 'Unknown Artist',
          id: data.artist.id || artistId,
          picUrl: data.artist.picUrl || '',
          albumSize: data.artist.albumSize || 0
        })
      }

      // 確保 hotAlbums 是陣列
      const newAlbums = Array.isArray(data.hotAlbums) ? data.hotAlbums : []
      
      setAlbums(prev => offset === 0 ? newAlbums : [...prev, ...newAlbums])
      setHasMore(newAlbums.length === limit)
    } catch (error) {
      console.error('Error fetching albums:', error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchAlbums()
  }, [artistId, offset])

  if (!artist) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-2 min-[610px]:grid-cols-3 md:grid-cols-2 min-[900px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="bg-card text-card-foreground p-4 rounded-2xl shadow border space-y-2">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">{artist.name}&lsquo;s Albums</h1>
      </div>

      <div className="grid grid-cols-2 min-[610px]:grid-cols-3 md:grid-cols-2 min-[900px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {albums.map((album, index) => (
          <div
            key={album.id}
            ref={index === albums.length - 1 ? lastAlbumRef : undefined}
            className="bg-card text-card-foreground p-4 rounded-2xl shadow border cursor-pointer hover:bg-accent/50"
          >
            <Link href={`/artist/${artistId}/album/${album.id}`}>
              <div className="group-hover:shadow-lg transition-shadow duration-300">
                <div className="relative aspect-square mb-2">
                  <img
                    src={`${album.picUrl}?param=250y250`}
                    alt={album.name}
                    className="object-cover rounded-xl"
                  />
                </div>
                <h3 className="font-semibold truncate">{album.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{artist.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {`${new Date(album.publishTime).getFullYear()} • ${getTranslatedType(album.type)}`}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 min-[610px]:grid-cols-3 md:grid-cols-2 min-[900px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="bg-card text-card-foreground p-4 rounded-2xl shadow border space-y-2">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}