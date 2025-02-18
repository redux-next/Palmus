import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.palmus.co.uk/style/detail?tagId=${id}`)
    const data = await response.json()

    if (data.code === 200 && data.data) {
      // 直接使用 data.data 中的欄位
      return NextResponse.json({
        code: 200,
        data: {
          id: data.data.tagId,
          name: data.data.enName,
          cover: data.data.cover[0],
          songCount: data.data.songNum,
          artistCount: data.data.artistNum
        }
      })
    }

    return NextResponse.json({ code: 200, data: {} })
  } catch (error) {
    console.error('Error fetching genre details:', error)
    return NextResponse.json({ error: 'Failed to fetch genre details' }, { status: 500 })
  }
}
