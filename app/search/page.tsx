"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"
import { usePlayerStore } from '@/lib/playerStore'
import Link from "next/link"

const MAIN_GENRES = [
  {
    id: 1017,
    name: "Hip Hop/Rap",
    cover: "http://p1.music.126.net/9_zXRSBgJWdCbb76L9IEEw==/109951169246726618.jpg"
  },
  {
    id: 1008,
    name: "Rock",
    cover: "http://p1.music.126.net/fodhDOi6gYV_mTPfS83M_A==/109951169246726732.jpg"
  },
  {
    id: 1252,
    name: "ACG",
    cover: "http://p1.music.126.net/2gCjzR1gJwAuJO-18bVqcg==/109951165924158226.jpg"
  },
  {
    id: 1000,
    name: "Pop",
    cover: "http://p1.music.126.net/VcsE6_F3cqMm3D9SWyIR5A==/109951165924166690.jpg"
  },
  {
    id: 1003,
    name: "Folk",
    cover: "http://p1.music.126.net/cHsQLxn5_EfXBvyrCUYivg==/109951165924166722.jpg"
  },
  {
    id: 10119,
    name: "Chinese Style",
    cover: "http://p1.music.126.net/yPUE0D85zvoEX2PEbtXW2Q==/109951169946904528.jpg"
  },
  {
    id: 1001,
    name: "Chinese",
    cover: "http://p1.music.126.net/y9IpRuoIgK9ElVZUPXrvYA==/109951165972470443.jpg"
  },
  {
    id: 1022,
    name: "Classical",
    cover: "http://p1.music.126.net/vHzDj7A5R3HrwKj4XthHyg==/109951165956566404.jpg"
  },
  {
    id: 1011,
    name: "Jazz",
    cover: "http://p1.music.126.net/Cjd5NyzCIfgFSsjlG8wFPg==/109951165924165120.jpg"
  },
  {
    id: 1010,
    name: "OST",
    cover: "http://p1.music.126.net/h2zwaZZVGEKNKl9FHaQ59A==/109951165972475247.jpg"
  },
  {
    id: 1026,
    name: "Children",
    cover: "http://p1.music.126.net/cXGg3hHBQXCOE9E1Y5_Rkg==/109951165972465423.jpg"
  },
  {
    id: 79088,
    name: "Manyao DJ",
    cover: "http://p1.music.126.net/bz7FEuoG0Pk-QvydzX0gCA==/109951169246716943.jpg"
  },
  {
    id: 1014,
    name: "Alternative/Indie",
    cover: "http://p1.music.126.net/iq8nR69LHja1kp_Pf2p-jg==/109951165924160813.jpg"
  },
  {
    id: 1077,
    name: "Country",
    cover: "http://p1.music.126.net/-xJEn-zfr2LnRiQV-wXkTQ==/109951165924170158.jpg"
  },
  {
    id: 1007,
    name: "New Age",
    cover: "http://p1.music.126.net/vJtThRB3HZPOU5NXgPe4rw==/109951165924172550.jpg"
  },
  {
    id: 152124,
    name: "Punk",
    cover: "http://p1.music.126.net/w7XatOMYKxHjPqFtIrTQ7Q==/109951165924157443.jpg"
  },
  {
    id: 1071,
    name: "Latin",
    cover: "http://p1.music.126.net/2IOu18NJ9CJwmlX2qn2fcg==/109951165924161783.jpg"
  },
  {
    id: 1041,
    name: "Metal",
    cover: "http://p1.music.126.net/bYFNmylPAHSjyozPdagpgw==/109951165924168501.jpg"
  },
  {
    id: 1037,
    name: "Blues",
    cover: "http://p1.music.126.net/3Xi_u_T8UqpZbVO4t-A8-A==/109951169246723846.jpg"
  },
  {
    id: 1043,
    name: "Reggae",
    cover: "http://p1.music.126.net/piZkji7JhjknNUjZiQCf7Q==/109951169246730073.jpg"
  },
  {
    id: 1012,
    name: "World Music",
    cover: "http://p1.music.126.net/EZ30SLbO9_5qhWzaI4a45A==/109951165924161949.jpg"
  }
] as const

type Song = {
  id: number
  name: string
  dt: number  // 加入歌曲時長欄位
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

export default function Search() {
  const router = useRouter()
  const [keyword, setKeyword] = useState("")
  const [results, setResults] = useState<Song[] | Album[] | Artist[]>([])
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
      
      {/* 搜索框 */}
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

      {/* 標籤 */}
      <div className="flex space-x-4">
        <Button 
          className={`rounded-xl ${activeTab === 1 ? 'bg-primary text-secondary' : 'bg-transparent border border text-primary hover:text-secondary'}`} 
          onClick={() => handleTabClick(1)}
        >
          Songs
        </Button>
        <Button 
          className={`rounded-xl ${activeTab === 10 ? 'bg-primary text-secondary' : 'bg-transparent border border text-primary hover:text-secondary'}`} 
          onClick={() => handleTabClick(10)}
        >
          Albums
        </Button>
        <Button 
          className={`rounded-xl ${activeTab === 100 ? 'bg-primary text-secondary' : 'bg-transparent border border text-primary hover:text-secondary'}`} 
          onClick={() => handleTabClick(100)}
        >
          Artists
        </Button>
      </div>

      {/* 搜索結果 */}
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <Loader />
        </div>
      ) : keyword ? (
        // 原有的搜索結果顯示
        <div className={activeTab === 1 ? "space-y-2" : "grid grid-cols-2 min-[610px]:grid-cols-3 md:grid-cols-2 min-[900px]:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"}>
          {activeTab === 1 && (results as Song[]).map((song) => (
            <div 
              key={song.id} 
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-accent/50 cursor-pointer" 
              onClick={() => handleSongClick(song)}
            >
              <img
                src={song.al?.picUrl + "?param=92y92"}
                alt={song.name}
                className="w-12 h-12 rounded-lg shrink-0"
              />
              <div className="w-[30%] min-w-0">
                <p className="font-medium truncate">{song.name}</p>
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
              </div>
              <div className="hidden lg:block w-[30%] min-w-0">
                <p className="text-sm text-muted-foreground truncate text-center">
                  <Link
                    href={`/artist/${song.ar[0].id}/album/${song.al.id}`}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {song.al?.name}
                  </Link>
                </p>
              </div>
              <div className="text-sm text-muted-foreground ml-auto">
                {Math.floor(song.dt / 1000 / 60)}:{String(Math.floor(song.dt / 1000 % 60)).padStart(2, '0')}
              </div>
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
        </div>
      ) : (
        <div className="grid grid-cols-2 min-[610px]:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {MAIN_GENRES.map((genre) => (
            <Link
              key={genre.id}
              href={`/genre/${genre.id}`}
              className="relative group bg-card hover:bg-accent/50 rounded-2xl shadow"
            >
              <div className="aspect-video relative rounded-xl overflow-hidden">
                <img
                  src={genre.cover}
                  alt={genre.name}
                  className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-2 left-0 right-0 text-sm font-medium text-white text-center truncate px-2">
                  {genre.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
