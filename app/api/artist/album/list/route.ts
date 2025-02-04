import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const limit = searchParams.get('limit') || '30'
  const offset = searchParams.get('offset') || '0'

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://palmus-api.vercel.app/artist/album?id=${id}&limit=${limit}&offset=${offset}`)
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching artist albums:', error)
    return NextResponse.json({ error: 'Failed to fetch artist albums' }, { status: 500 })
  }
}
