import { NextResponse } from 'next/server'
import { imageCache } from '@/lib/cache'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const param = searchParams.get('param')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        // 構建快取 key
        const cacheKey = `${id}${param ? `-${param}` : ''}`
        
        // 檢查快取
        const cachedImage = imageCache.get(cacheKey)
        if (cachedImage) {
            return new NextResponse(cachedImage.buffer, {
                headers: {
                    'Content-Type': cachedImage.contentType,
                    'Cache-Control': 'public, max-age=604800' // 7天的秒數
                }
            })
        }

        const response = await fetch(`https://music.163.com/api/song/detail?ids=["${id}"]`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Host': 'music.163.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 Edg/132.0.0.0'
            }
        })

        const data = await response.json()

        if (!data.songs?.[0]?.album?.picUrl) {
            return NextResponse.json({ error: 'Album image not found' }, { status: 404 })
        }

        // 構建圖片 URL
        let imageUrl = data.songs[0].album.picUrl
        if (param) {
            imageUrl += `?param=${param}`
        }

        // 獲取圖片數據
        const imageResponse = await fetch(imageUrl)
        const imageData = await imageResponse.arrayBuffer()
        const contentType = imageResponse.headers.get('Content-Type') || 'image/jpeg'

        // 儲存到快取
        imageCache.set(cacheKey, {
            buffer: imageData,
            contentType
        })

        // 返回圖片數據
        return new NextResponse(imageData, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=604800' // 7天的秒數
            }
        })

    } catch (error) {
        console.error('Error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
