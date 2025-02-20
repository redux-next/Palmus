"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlayerStore } from "@/lib/playerStore"
import Link from "next/link"
import { Play, CircleCheck, PlusCircle } from 'lucide-react'  // 修改 import

// 新增專輯資訊型別
type Album = {
  name: string
  picUrl: string
  publishTime: number
  size: number
  description: string
  artist: {
    name: string
    id: number
  }
}

type Song = {
  id: number
  name: string
  ar: { id: number; name: string; tns?: string[]; alia?: string[] }[]
  al: { 
    id: number
    name: string
    pic_str: string
  }
  dt: number // 歌曲時長（毫秒）
  tns?: string[] // 翻譯名稱
}

export default function AlbumPage() {
  const params = useParams()
  const [songs, setSongs] = useState<Song[]>([])
  const [album, setAlbum] = useState<Album | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { 
    setCurrentSong, 
    setCurrentAlbum, 
    addLikedAlbum,
    removeLikedAlbum,
    isLikedAlbum
  } = usePlayerStore()

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        const response = await fetch(`/api/artist/album?id=${params.alid}`)
        const data = await response.json()
        setSongs(data.songs || [])
        if (data.album) {
          setAlbum({
            name: data.album.name,
            picUrl: data.album.picUrl,
            publishTime: data.album.publishTime,
            size: data.album.size,
            description: data.album.description,
            artist: {
              name: data.album.artist.name,
              id: data.album.artist.id
            }
          })
        }
      } catch (error) {
        console.error('Error fetching album data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.alid) {
      void fetchAlbumData()
    }
  }, [params.alid])

  const handleSongClick = (song: Song) => {
    setCurrentSong({
      id: song.id,
      name: song.name,
      artists: song.ar.map(artist => ({
        id: artist.id,
        name: artist.name
      })),
      album: {
        id: song.al.id,
        name: song.al.name,
        cover: `/api/image?id=${song.id}`
      }
    })
  }

  const handlePlayAlbum = () => {
    if (songs.length > 0) {
      // 設置當前專輯
      setCurrentAlbum(Number(params.alid), songs.map(song => ({
        id: song.id,
        name: song.name,
        artists: song.ar.map(artist => artist.name).join('/'),
        albumName: song.al.name,
        cover: `/api/image?id=${song.id}`
      })))
      // 播放第一首歌
      const firstSong = songs[0]
      handleSongClick(firstSong)
    }
  }

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!album) return

    if (isLikedAlbum(Number(params.alid))) {
      removeLikedAlbum(Number(params.alid))
    } else {
      addLikedAlbum({
        id: Number(params.alid),
        name: album.name,
        artists: [{
          id: album.artist.id,
          name: album.artist.name
        }],
        cover: album.picUrl,
        songCount: album.size
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center gap-6">
          <Skeleton className="h-64 w-64 sm:h-48 sm:w-48 md:h-64 md:w-64 lg:h-48 lg:w-48 rounded-xl shrink-0" />
          <div className="space-y-3 w-full text-center md:text-center sm:text-left lg:text-left">
            <Skeleton className="h-12 w-full max-w-lg mx-auto sm:mx-0 md:mx-auto lg:mx-0" />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 justify-center sm:justify-start md:justify-center lg:justify-start">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-start md:justify-center lg:justify-start">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-36 rounded-full" />
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg">
              <Skeleton className="w-6 h-4" />
              <Skeleton className="h-12 w-12 rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-full max-w-[200px]" />
                <Skeleton className="h-3 w-full max-w-[150px]" />
              </div>
              <Skeleton className="h-4 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!album) return null

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center gap-6">
        <img
          src={album.picUrl}
          alt={album.name}
          className="h-64 w-64 sm:h-48 sm:w-48 md:h-64 md:w-64 lg:h-48 lg:w-48 rounded-xl shadow-md shrink-0"
        />
        <div className="space-y-3 text-center md:text-center sm:text-left lg:text-left">
          <h1 className="text-4xl font-bold leading-tight">{album.name}</h1>
          <div className="flex flex-col items-center sm:items-start md:items-center lg:items-start gap-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm justify-center sm:justify-start md:justify-center lg:justify-start">
              <Link 
                href={`/artist/${album.artist.id}`}
                className="font-medium hover:underline"
              >
                {album.artist.name}
              </Link>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{new Date(album.publishTime).getFullYear()}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{album.size} songs</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayAlbum}
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
              >
                <Play size={20} />
                <span>Play</span>
              </button>
              <button
                onClick={handleToggleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                  isLikedAlbum(Number(params.alid))
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent/50'
                }`}
              >
                {isLikedAlbum(Number(params.alid)) ? (
                  <>
                    <CircleCheck size={20} />
                    <span>In Library</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={20} />
                    <span>Add to Library</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        {songs.map((song, index) => (
          <div
            key={song.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 cursor-pointer"
            onClick={() => handleSongClick(song)}
          >
            <span className="w-6 text-muted-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>
            <img 
              src={`/api/image?id=${song.id}&param=128y128`}
              alt={song.name}
              className="h-12 w-12 rounded-md"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">
                {song.name}
              </p>
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
            <span className="text-sm text-muted-foreground shrink-0">
              {Math.floor(song.dt / 60000)}:{String(Math.floor((song.dt % 60000) / 1000)).padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
