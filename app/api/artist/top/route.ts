import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://palmus-api.vercel.app/toplist/artist?type=2')
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching top artists:', error)
    return NextResponse.json({ error: 'Failed to fetch top artists' }, { status: 500 })
  }
}
