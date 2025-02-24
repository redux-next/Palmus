"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "./ui/input"
import Link from "next/link"
import { usePlayerStore } from "@/lib/playerStore"
import { useRouter } from "next/navigation"

type Suggestion = {
  result: {
    songs?: Array<{
      id: number
      name: string
      artists: Array<{ id: number; name: string }>
      album: { id: number; name: string }
    }>
    artists?: Array<{
      id: number
      name: string
      img1v1Url: string
    }>
    albums?: Array<{
      id: number
      name: string
      artist: { id: number; name: string }
    }>
  }
}

type Song = {
  id: number
  name: string
  artists: Array<{ id: number; name: string }>
  album: { 
    id: number
    name: string 
    img1v1Url?: string
    picUrl?: string
  }
}

export function NavSearch() {
  const router = useRouter()
  const [keyword, setKeyword] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestion | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (keyword.length < 1) {
        setSuggestions(null)
        return
      }

      try {
        const response = await fetch(`/api/search/suggest?keywords=${encodeURIComponent(keyword)}`)
        const data = await response.json()
        setSuggestions(data)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
      }
    }

    const timeoutId = setTimeout(() => {
      fetchSuggestions()
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [keyword])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSongClick = (song: Song) => {
    setCurrentSong({
      id: song.id,
      name: song.name,
      artists: song.artists.map(artist => ({
        id: artist.id,
        name: artist.name
      })),
      album: { 
        id: song.album.id,
        name: song.album.name,
        cover: `/api/image?id=${song.id}&param=512y512`
      }
    })
  }

  return (
    <div ref={wrapperRef} className="relative hidden lg:block w-64 xl:w-96 2xl:w-[30rem]">
      <Input
        type="text"
        placeholder="Search..."
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value)
          setShowSuggestions(true)
        }}
        className="w-full rounded-xl"
      />
      
      {showSuggestions && suggestions && keyword && (
        <div className="absolute top-full mt-2 w-full bg-background/75 backdrop-blur-2xl text-popover-foreground rounded-xl shadow-lg z-50 overflow-hidden border">
          {suggestions.result.songs && suggestions.result.songs.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-muted-foreground mb-2">Songs</div>
              {suggestions.result.songs.slice(0, 3).map((song) => (
                <div
                  key={song.id}
                  className="px-2 py-1 hover:bg-accent rounded-lg cursor-pointer"
                  onClick={() => handleSongClick(song)}
                >
                  <div className="font-medium">{song.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {song.artists.map((artist, index) => (
                      <span key={artist.id}>
                        {index > 0 && " / "}
                        <Link
                          href={`/artist/${artist.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSuggestions(false);
                          }}
                          className="hover:underline"
                        >
                          {artist.name}
                        </Link>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {suggestions.result.artists && suggestions.result.artists.length > 0 && (
            <div className="p-2 border-t">
              <div className="text-xs text-muted-foreground mb-2">Artists</div>
              {suggestions.result.artists.slice(0, 2).map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  onClick={() => {
                    setShowSuggestions(false)
                  }}
                  className="block px-2 py-1 hover:bg-accent rounded-lg"
                >
                  <div className="font-medium">{artist.name}</div>
                </Link>
              ))}
            </div>
          )}

          {suggestions.result.albums && suggestions.result.albums.length > 0 && (
            <div className="p-2 border-t">
              <div className="text-xs text-muted-foreground mb-2">Albums</div>
              {suggestions.result.albums.slice(0, 2).map((album) => (
                <Link
                  key={album.id}
                  href={`/artist/${album.artist.id}/album/${album.id}`}
                  onClick={() => {
                    setShowSuggestions(false)
                  }}
                  className="block px-2 py-1 hover:bg-accent rounded-lg"
                >
                  <div className="font-medium">{album.name}</div>
                  <div className="text-sm text-muted-foreground">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setShowSuggestions(false);
                        router.push(`/artist/${album.artist.id}`);
                      }}
                      className="hover:underline"
                    >
                      {album.artist.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
