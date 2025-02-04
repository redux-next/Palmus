type CacheItem<T> = {
  data: T
  timestamp: number
}

class Cache<T> {
  private cache: Map<string, CacheItem<T>>
  private ttl: number // time to live in milliseconds

  constructor(ttlHours: number = 12) {
    this.cache = new Map()
    this.ttl = ttlHours * 60 * 60 * 1000 // 轉換小時為毫秒
  }

  set(key: string, data: T) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    // 檢查緩存是否過期
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }
}

type PlaylistData = {
  songs: Array<{
    id: number
    name: string
    ar: Array<{ id: number; name: string }>
    al: { picUrl: string; name: string }
  }>
}

type SearchResult = {
  songs?: Array<{
    id: number
    name: string
    ar: Array<{ id: number; name: string }>
    al: { picUrl: string; name: string }
  }>
  albums?: Array<SearchAlbum>
  artists?: Array<SearchArtist>
  playlists?: Array<SearchPlaylist>
}

type SearchAlbum = {
  id: number
  name: string
  picUrl: string
  artist: { name: string }
  publishTime: number
}

type SearchArtist = {
  id: number
  name: string
  img1v1Url: string
  albumSize: number
}

type SearchPlaylist = {
  id: number
  name: string
  coverImgUrl: string
  creator: { nickname: string }
  description: string
}

type SearchData = {
  result: SearchResult
}

type ImageData = {
  buffer: ArrayBuffer
  contentType: string
}

// 創建一個緩存實例
export const playlistCache = new Cache<PlaylistData>(12) // 12小時緩存

// 為搜尋結果創建一個新的緩存實例（設置較短的緩存時間，例如 1 小時）
export const searchCache = new Cache<SearchData>(1)

// 為圖片創建一個新的緩存實例（設置 7 天的緩存時間）
export const imageCache = new Cache<ImageData>(24 * 7) // 7天緩存
