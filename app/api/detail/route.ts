import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        // Get the URL from the request
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
        }

        // Make request to Palmus API
        const response = await fetch(`https://api.palmus.co.uk/song/detail?ids=${id}`)
        
        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch from Palmus API' },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}