import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const keywords = searchParams.get('keywords')
  try {
    const response = await fetch(`https://api.palmus.co.uk/search/suggest?keywords=${keywords}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching suggestion', error)
    return NextResponse.json({ error: 'Failed to fetch suggestion' }, { status: 500 })
  }
}
