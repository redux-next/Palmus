import { NextResponse } from 'next/server'
import { searchCache } from '@/lib/cache'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const keywords = searchParams.get('keywords')
  const type = searchParams.get('type')
  const limit = searchParams.get('limit')
  const offset = searchParams.get('offset')

  // 生成緩存鍵，包含 offset
  const cacheKey = `search-${keywords}-${type}-${limit}-${offset}`

  try {
    // 檢查緩存
    const cachedData = searchCache.get(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // 如果沒有緩存，則從 API 獲取數據
    const response = await fetch(
      `https://palmus-api.vercel.app/cloudsearch?keywords=${keywords}&type=${type}&limit=${limit}&offset=${offset}`
    )
    const data = await response.json()

    // 存儲到緩存
    searchCache.set(cacheKey, data)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}
