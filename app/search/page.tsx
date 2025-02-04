"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"
import { usePlayerStore } from '@/lib/playerStore'
import Link from "next/link"

type Song = {
  id: number
  name: string
  al: { 
    id: number
    picUrl: string
    name: string 
  }
  ar: { 
    id: number
    name: string 
  }[]
}

type Album = {
  id: number
  name: string
  picUrl: string
  artist: { 
    id: number
    name: string 
  }
  publishTime: number
}

type Artist = {
  id: number
  name: string
  img1v1Url: string
  albumSize: number
}

type Playlist = {
  id: number
  name: string
  coverImgUrl: string
  creator: { nickname: string }
  description: string
}

export default function Search() {
  const router = useRouter()
  const [keyword, setKeyword] = useState("")
  const [results, setResults] = useState<Song[] | Album[] | Artist[] | Playlist[]>([])
  const [activeTab, setActiveTab] = useState(1)
  const [loading, setLoading] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong)

  const handleSearch = useCallback(async (type = activeTab) => {
    setLoading(true)
    setResults([])
    try {
      const response = await fetch(`/api/search?keywords=${keyword}&type=${type}&limit=60&offset=0`)
      const data = await response.json()
      
      switch (type) {
        case 1:
          setResults(data.result.songs || [])
          break
        case 10:
          setResults(data.result.albums || [])
          break
        case 100:
          setResults(data.result.artists || [])
          break
        case 1000:
          setResults(data.result.playlists || [])
          break
        default:
          setResults([])
      }
    } catch (error) {
      console.error('Error searching:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [keyword, activeTab])

  useEffect(() => {
    if (!keyword) {
      setResults([])
      return
    }
    
    const currentTimeout = setTimeout(() => handleSearch(), 1000)
    setTypingTimeout(currentTimeout)
    
    return () => clearTimeout(currentTimeout)
  }, [keyword, handleSearch])

  const handleTabClick = (type: number) => {
    setActiveTab(type)
    if (keyword) {
      handleSearch(type)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
      handleSearch()
    }
  }

  const handleSongClick = (song: Song) => {
    setCurrentSong({
      id: song.id,
      name: song.name,
      artists: song.ar.map(artist => artist.name).join('/'),
      albumName: song.al.name,
      cover: song.al.picUrl
    })
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const options = { month: 'long', year: 'numeric' } as const
    return date.toLocaleDateString('en-US', options)
  }

  return (
    <div className="flex flex-col flex-grow space-y-4">
      <h1 className="text-2xl font-bold">Search</h1>
      <div className="flex space-x-2">
        <Input 
          type="text" 
          placeholder="Find the song you like" 
          className="flex-grow rounded-xl" 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="flex space-x-4 mt-4">
        <Button className={`rounded-xl ${activeTab === 1 ? 'bg-primary text-secondary' : 'bg-transparent border border text-primary hover:text-secondary'}`} onClick={() => handleTabClick(1)}>Songs</Button>
        <Button className={`rounded-xl ${activeTab === 10 ? 'bg-primary text-secondary' : 'bg-transparent border border text-primary hover:text-secondary'}`} onClick={() => handleTabClick(10)}>Albums</Button>
        <Button className={`rounded-xl ${activeTab === 100 ? 'bg-primary text-secondary' : 'bg-transparent border border text-primary hover:text-secondary'}`} onClick={() => handleTabClick(100)}>Artists</Button>
        <Button className={`rounded-xl ${activeTab === 1000 ? 'bg-primary text-secondary' : 'bg-transparent border border text-primary hover:text-secondary'}`} onClick={() => handleTabClick(1000)}>Playlists</Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader />
        </div>
      ) : (
        <div className="grid grid-cols-2 min-[610px]:grid-cols-3 md:grid-cols-2 min-[900px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {activeTab === 1 && (results as Song[]).map((song) => (
            <div 
              key={song.id} 
              className="bg-card text-card-foreground p-4 rounded-2xl shadow border cursor-pointer hover:bg-accent/50" 
              onClick={() => handleSongClick(song)}
              data-type="song" 
              data-id={song.id}
            >
              <div className="relative aspect-square mb-2">
                <img
                  src={song.al?.picUrl + "?param=250x250"}
                  alt={song.name}
                  className="object-cover rounded-xl"
                />
              </div>
              <h3 className="font-semibold truncate">{song.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                {song.ar?.map((artist, index) => (
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
              <p className="text-sm text-muted-foreground truncate">
                <Link 
                  href={`/artist/${song.ar[0].id}/album/${song.al.id}`}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {song.al?.name}
                </Link>
              </p>
            </div>
          ))}

          {activeTab === 10 && (results as Album[]).map((album) => (
            <Link
              key={album.id}
              href={`/artist/${album.artist.id}/album/${album.id}`}
              className="bg-card text-card-foreground p-4 rounded-2xl shadow border hover:bg-accent/50"
              data-type="album"
            >
              <div className="relative aspect-square mb-2">
                <img
                  src={album.picUrl + "?param=250x250"}
                  alt={album.name}
                  className="object-cover rounded-xl"
                />
              </div>
              <h3 className="font-semibold truncate">{album.name}</h3>
              <p className="text-sm text-muted-foreground truncate">
                <span 
                  className="hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/artist/${album.artist.id}`);
                  }}
                >
                  {album.artist?.name}
                </span>
              </p>
              <p className="text-sm text-muted-foreground truncate">{formatDate(album.publishTime)}</p>
            </Link>
          ))}

          {activeTab === 100 && (results as Artist[]).map((artist) => (
            <Link
              key={artist.id}
              href={`/artist/${artist.id}`}
              className="bg-card text-card-foreground p-4 rounded-2xl shadow border hover:bg-accent/50"
              data-type="artist"
            >
              <div className="relative aspect-square mb-2">
                <img
                  src={artist.img1v1Url + "?param=250x250"}
                  alt={artist.name}
                  className="object-cover rounded-xl"
                />
              </div>
              <h3 className="font-semibold truncate">{artist.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{artist.albumSize} albums</p>
            </Link>
          ))}

          {activeTab === 1000 && (results as Playlist[]).map((playlist) => (
            <div key={playlist.id} className="bg-card text-card-foreground p-4 rounded-2xl shadow border" data-type="playlist">
              <div className="relative aspect-square mb-2">
                <img
                  src={playlist.coverImgUrl + "?param=250x250"}
                  alt={playlist.name}
                  className="object-cover rounded-xl"
                />
              </div>
              <h3 className="font-semibold truncate">{playlist.name}</h3>
              <p className="text-sm text-muted-foreground truncate">by {playlist.creator?.nickname}</p>
              <p className="text-sm text-muted-foreground truncate">{playlist.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
