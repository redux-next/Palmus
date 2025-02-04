import { NextResponse } from 'next/server'
import { playlistCache } from '@/lib/cache'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const limit = searchParams.get('limit')

  // 生成緩存鍵
  const cacheKey = `playlist-${id}-${limit}`

  try {
    // 檢查緩存
    const cachedData = playlistCache.get(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // 如果沒有緩存，則從 API 獲取數據
    const response = await fetch(
      `https://palmus-api.vercel.app/playlist/track/all?id=${id}&limit=${limit}`
    )
    const data = await response.json()

    // 存儲到緩存
    playlistCache.set(cacheKey, data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching playlist:', error)
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 })
  }
}
