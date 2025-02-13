import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://palmus-api.vercel.app/song/dynamic/cover?id=${id}`)
    const data = await response.json()
    
    if (data.code === 200 && data.data?.videoPlayUrl) {
      // Only return necessary data
      return NextResponse.json({
        code: 200,
        data: {
          videoPlayUrl: data.data.videoPlayUrl,
          needTransition: data.data.needTransition
        }
      })
    }
    
    return NextResponse.json({ code: 200, data: {} })
  } catch (error) {
    console.error('Error fetching dynamic cover:', error)
    return NextResponse.json({ error: 'Failed to fetch dynamic cover' }, { status: 500 })
  }
}
