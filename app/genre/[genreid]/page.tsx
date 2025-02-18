"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useInView } from "react-intersection-observer"
import Link from "next/link"
import { usePlayerStore } from "@/lib/playerStore"
import { formatFollowers } from "@/lib/utils"

type Genre = {
  id: number
  name: string
  cover: string
  songCount: string
  artistCount: string
}

type Song = {
  id: number
  name: string
  dt: number
  ar: { id: number; name: string }[]
  al: { 
    id: number
    picUrl: string
    name: string 
  }
}

type Album = {
  id: number
  name: string
  picUrl: string
  artist: { id: number; name: string }
  publishTime: number
}

type Artist = {
  id: number
  name: string
  img1v1Url: string
  fansCount: number
  albumSize: number
}

type TabData<T> = {
  items: T[]
  cursor: number
  hasMore: boolean
  isLoading: boolean
}

export default function GenrePage() {
  const params = useParams()
  const [genre, setGenre] = useState<Genre | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { setCurrentSong } = usePlayerStore()
  const { ref, inView } = useInView()

  // Track the active tab using state (instead of querying the DOM)
  const [activeTab, setActiveTab] = useState<"song" | "album" | "artist">("song")

  const [songs, setSongs] = useState<TabData<Song>>({
    items: [],
    cursor: 0,
    hasMore: true,
    isLoading: false
  })
  const [albums, setAlbums] = useState<TabData<Album>>({
    items: [],
    cursor: 0,
    hasMore: true,
    isLoading: false
  })
  const [artists, setArtists] = useState<TabData<Artist>>({
    items: [],
    cursor: 0,
    hasMore: true,
    isLoading: false
  })

  const fetchData = async (type: string, cursor: number) => {
    const response = await fetch(`/api/genre/list?id=${params.genreid}&type=${type}&offset=${cursor}`)
    const data = await response.json()
    return data
  }

  const loadMore = async (type: "song" | "album" | "artist") => {
    if (type === "song") {
      if (!songs.hasMore || songs.isLoading) return;
      setSongs((prev: TabData<Song>) => ({ ...prev, isLoading: true }));
      try {
        const data = await fetchData("song", songs.cursor);
        setSongs((prev: TabData<Song>) => ({
          items: [...prev.items, ...data.data.songs],
          cursor: data.data.page.cursor + data.data.page.size,
          hasMore: data.data.page.more,
          isLoading: false
        }));
      } catch (error) {
        console.error(error);
        setSongs((prev: TabData<Song>) => ({ ...prev, isLoading: false }));
      }
    } else if (type === "album") {
      if (!albums.hasMore || albums.isLoading) return;
      setAlbums((prev: TabData<Album>) => ({ ...prev, isLoading: true }));
      try {
        const data = await fetchData("album", albums.cursor);
        setAlbums((prev: TabData<Album>) => ({
          items: [...prev.items, ...data.data.albums],
          cursor: data.data.page.cursor + data.data.page.size,
          hasMore: data.data.page.more,
          isLoading: false
        }));
      } catch (error) {
        console.error(error);
        setAlbums((prev: TabData<Album>) => ({ ...prev, isLoading: false }));
      }
    } else if (type === "artist") {
      if (!artists.hasMore || artists.isLoading) return;
      setArtists((prev: TabData<Artist>) => ({ ...prev, isLoading: true }));
      try {
        const data = await fetchData("artist", artists.cursor);
        setArtists((prev: TabData<Artist>) => ({
          items: [...prev.items, ...data.data.artists],
          cursor: data.data.page.cursor + data.data.page.size,
          hasMore: data.data.page.more,
          isLoading: false
        }));
      } catch (error) {
        console.error(error);
        setArtists((prev: TabData<Artist>) => ({ ...prev, isLoading: false }));
      }
    }
  }  

  // 新增清理函數
  const resetState = () => {
    setGenre(null)
    setSongs({
      items: [],
      cursor: 0,
      hasMore: true,
      isLoading: false
    })
    setAlbums({
      items: [],
      cursor: 0,
      hasMore: true,
      isLoading: false
    })
    setArtists({
      items: [],
      cursor: 0,
      hasMore: true,
      isLoading: false
    })
    setIsLoading(true)
  }

  // 修改 useEffect，在 params 改變時重置狀態
  useEffect(() => {
    resetState()

    if (params.genreid) {
      const fetchGenreData = async () => {
        try {
          const response = await fetch(`/api/genre?id=${params.genreid}`)
          const data = await response.json()
          if (data.code === 200) {
            setGenre(data.data)
          }
        } catch (error) {
          console.error(error)
        } finally {
          setIsLoading(false)
        }
      }
      
      fetchGenreData()
      loadMore("song")
      loadMore("album")
      loadMore("artist")
    }

    // 清理函數
    return () => {
      resetState()
    }
  }, [params.genreid])

  // Infinite scroll: load more data when the observer comes into view and the active tab has more items
  useEffect(() => {
    if (inView) {
      if (activeTab === "song" && songs.hasMore && !songs.isLoading) {
        loadMore("song")
      } else if (activeTab === "album" && albums.hasMore && !albums.isLoading) {
        loadMore("album")
      } else if (activeTab === "artist" && artists.hasMore && !artists.isLoading) {
        loadMore("artist")
      }
    }
  }, [inView, activeTab, songs, albums, artists])

  if (isLoading) return <GenreSkeleton />
  if (!genre) return null

  return (
    <div>
      <div className="relative h-[40vh]">
        {genre.cover && (
          <img 
            src={genre.cover} 
            alt={genre.name}
            className="w-full h-full object-cover rounded-t-2xl"
          />
        )}
        <div className="absolute bottom-0 p-6 bg-gradient-to-t from-background to-transparent w-full">
          <h1 className="text-4xl font-bold">{genre.name}</h1>
        </div>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={(val) => setActiveTab(val as "song" | "album" | "artist")} 
        className="relative mt-4"
      >
        <div className="sticky top-0 z-10 mb-4">
          <div className="max-w-lg mx-auto px-4">
            <TabsList className="w-full bg-background/75 backdrop-blur-2xl border shadow-sm">
              <TabsTrigger value="song" className="flex-1">Songs</TabsTrigger>
              <TabsTrigger value="album" className="flex-1">Albums</TabsTrigger>
              <TabsTrigger value="artist" className="flex-1">Artists</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="song" className="space-y-2">
          {songs.items.map((song) => (
            <div 
              key={`song-${song.id}`}  // 修改 key
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-accent/50 cursor-pointer" 
              onClick={() => setCurrentSong({
                id: song.id,
                name: song.name,
                artists: song.ar.map(a => a.name).join('/'),
                albumName: song.al.name,
                cover: song.al.picUrl
              })}
            >
              <img
                src={song.al.picUrl + "?param=92y92"}
                alt={song.name}
                className="w-12 h-12 rounded-lg shrink-0"
              />
              <div className="w-[30%] min-w-0">
                <p className="font-medium truncate">{song.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {song.ar.map((artist, index) => (
                    <span key={artist.id}>
                      {index > 0 && " / "}
                      <Link 
                        href={`/artist/${artist.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {artist.name}
                      </Link>
                    </span>
                  ))}
                </p>
              </div>
              <div className="hidden lg:block w-[30%] min-w-0">
                <p className="text-sm text-muted-foreground truncate text-center">
                  <Link
                    href={`/artist/${song.ar[0].id}/album/${song.al.id}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {song.al.name}
                  </Link>
                </p>
              </div>
              <div className="text-sm text-muted-foreground ml-auto">
                {Math.floor(song.dt / 1000 / 60)}:{String(Math.floor(song.dt / 1000 % 60)).padStart(2, '0')}
              </div>
            </div>
          ))}
          {songs.isLoading && (
            <div className="space-y-2">
              {[...Array(12)].map((_, i) => (
                <div key={`song-loading-${i}`} className="flex items-center gap-4 p-4 rounded-xl">
                  <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                  <div className="w-[30%] min-w-0">
                    <Skeleton className="h-5 w-[120px] mb-2" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <div className="hidden lg:block w-[30%]">
                    <Skeleton className="h-4 w-[160px] mx-auto" />
                  </div>
                  <Skeleton className="h-4 w-[40px] ml-auto" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="album" className="grid grid-cols-2 min-[610px]:grid-cols-3 md:grid-cols-2 min-[900px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {albums.items.map((album) => (
            <div
              key={`album-${album.id}`}
              className="bg-card text-card-foreground p-4 rounded-2xl shadow border hover:bg-accent/50 cursor-pointer"
              onClick={() => {
                const url = `/artist/${album.artist.id}/album/${album.id}`
                window.location.href = url
              }}
            >
              <div className="relative aspect-square mb-2">
                <img
                  src={album.picUrl + "?param=250x250"}
                  alt={album.name}
                  className="object-cover rounded-xl"
                />
              </div>
              <h3 className="font-semibold truncate">{album.name}</h3>
              <p 
                className="text-sm text-muted-foreground truncate hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  window.location.href = `/artist/${album.artist.id}`
                }}
              >
                {album.artist.name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {new Date(album.publishTime).getFullYear()}
              </p>
            </div>
          ))}
          {albums.isLoading && (
            <>
              {[...Array(12)].map((_, i) => (
                <div key={`album-loading-${i}`} className="bg-card text-card-foreground p-4 rounded-2xl shadow border">
                  <Skeleton className="aspect-square rounded-xl mb-2" />
                  <Skeleton className="h-5 w-[80%] mb-2" />
                  <Skeleton className="h-4 w-[60%]" />
                </div>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="artist" className="grid grid-cols-2 min-[610px]:grid-cols-3 md:grid-cols-2 min-[900px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {artists.items.map((artist) => (
            <div
              key={`artist-${artist.id}`}
              className="bg-card text-card-foreground p-4 rounded-2xl shadow border hover:bg-accent/50 cursor-pointer"
              onClick={() => {
                const url = `/artist/${artist.id}`
                window.location.href = url
              }}
            >
              <div className="relative aspect-square mb-2">
                <img
                  src={artist.img1v1Url ? artist.img1v1Url + "?param=250x250" : "/placeholder.svg"}
                  alt={artist.name}
                  className="object-cover rounded-xl"
                />
              </div>
              <h3 className="font-semibold truncate">{artist.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {artist.albumSize} albums
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {formatFollowers(artist.fansCount)} followers
              </p>
            </div>
          ))}
          {artists.isLoading && (
            <>
              {[...Array(12)].map((_, i) => (
                <div key={`artist-loading-${i}`} className="bg-card text-card-foreground p-4 rounded-2xl shadow border">
                  <Skeleton className="aspect-square rounded-xl mb-2" />
                  <Skeleton className="h-5 w-[80%] mb-2" />
                  <Skeleton className="h-4 w-[60%]" />
                </div>
              ))}
            </>
          )}
        </TabsContent>

        {(songs.hasMore || albums.hasMore || artists.hasMore) && (
          <div ref={ref} className="h-8" />
        )}
      </Tabs>
    </div>
  )
}

// Skeleton component for loading state
function GenreSkeleton() {
  return (
    <div>
      <div className="relative h-[40vh]">
        <Skeleton className="w-full h-full rounded-t-2xl" />
        <div className="absolute bottom-0 p-6 bg-gradient-to-t from-background to-transparent w-full">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <div className="mt-4">
        {/* Tabs Skeleton */}
        <div className="sticky top-0 z-10 mb-4">
          <div className="max-w-lg mx-auto px-4">
            <div className="w-full h-12 rounded-2xl bg-background/75 backdrop-blur-2xl border shadow-sm p-1 flex">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="flex-1 h-full mx-[2px] rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Songs List Skeleton */}
        <div className="space-y-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
              <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
              <div className="w-[30%] min-w-0">
                <Skeleton className="h-5 w-[120px] mb-2" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
              <div className="hidden lg:block w-[30%]">
                <Skeleton className="h-4 w-[160px] mx-auto" />
              </div>
              <Skeleton className="h-4 w-[40px] ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}