import { NextResponse } from 'next/server'

type ListType = 'song' | 'album' | 'artist'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const type = searchParams.get('type') as ListType
  const offset = searchParams.get('offset') || '0'

  if (!id || !type) {
    return NextResponse.json({ 
      error: 'Missing required parameters' 
    }, { status: 400 })
  }

  // 確保 type 參數是有效的
  if (!['song', 'album', 'artist'].includes(type)) {
    return NextResponse.json({ 
      error: 'Invalid type parameter' 
    }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.palmus.co.uk/style/${type}?tagId=${id}&cursor=${offset}`
    )
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error fetching genre ${type} data:`, error)
    return NextResponse.json({ 
      error: `Failed to fetch genre ${type} data` 
    }, { status: 500 })
  }
}
