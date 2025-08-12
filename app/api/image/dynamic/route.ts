import { NextRequest, NextResponse } from 'next/server';

interface iTunesSearchResult {
    collectionId: number;
    artistName: string;
    collectionName: string;
    trackName: string;
    artworkUrl100: string;
}

/**
 * This API route fetches dynamic song artwork.
 * It uses iTunes Search API to quickly find the album ID, then fetches the dynamic video.
 * If the Apple Music API fails or doesn't find the artwork,
 * it falls back to a secondary API using a song ID.
 *
 * @param {NextRequest} request The incoming Next.js request object.
 * @returns {NextResponse} A JSON response with the artwork data or an error.
 *
 * Query Parameters:
 * - `name` (string): The name of the song (required for iTunes Search API).
 * - `artist` (string): The artist name (optional, helps with accuracy).
 * - `album` (string): The album name (optional, helps with accuracy).
 * - `id` (string): The ID of the song (for the fallback API).
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const songName = searchParams.get('name');
    const artist = searchParams.get('artist') || '';
    const songId = searchParams.get('id');

    // --- Step 1: Try iTunes Search API first if songName is provided ---
    if (songName) {
        try {
            console.log(`Attempting to fetch from iTunes Search API with song: "${songName}" (will match against artist: "${artist}" if provided)`);

            // Build iTunes API query (only use song name for broader search)
            const encodedQuery = encodeURIComponent(songName);
            
            // Call iTunes Search API without limit to get more results
            const itunesResponse = await fetch(
                `https://itunes.apple.com/search?term=${encodedQuery}&media=music&entity=song&limit=200`
            );

            if (!itunesResponse.ok) {
                throw new Error(`iTunes API failed with status: ${itunesResponse.status}`);
            }

            const itunesData = await itunesResponse.json();
            
            // Check if we have results
            if (!itunesData.results || itunesData.results.length === 0) {
                throw new Error('No song found on iTunes for the given parameters.');
            }
            
            // Function to find best match based on artist if provided
            const findBestMatch = (results: iTunesSearchResult[]) => {
                // If no artist specified, return the first result
                if (!artist) {
                    return results[0];
                }
                
                // Score each result based on how well it matches artist
                const scoredResults = results.map(result => {
                    let score = 0;
                    
                    // Check artist match (case-insensitive)
                    if (artist && result.artistName) {
                        const artistLower = artist.toLowerCase();
                        const resultArtistLower = result.artistName.toLowerCase();
                        if (resultArtistLower.includes(artistLower) || artistLower.includes(resultArtistLower)) {
                            score += 1;
                        }
                    }
                    
                    return { result, score };
                });
                
                // Sort by score (highest first) and return the best match
                scoredResults.sort((a, b) => b.score - a.score);
                return scoredResults[0].result;
            };
            
            // Extract the best matching result
            const song = findBestMatch(itunesData.results);
            const albumId = song.collectionId;
            const artistName = song.artistName;
            const albumName = song.collectionName;
            
            console.log(`Found album ID: ${albumId} for "${albumName}" by ${artistName}`);

            // Fetch the Apple Music page to find the dynamic video
            const pageResponse = await fetch(`https://music.apple.com/album/${albumId}`, {
                redirect: 'follow',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!pageResponse.ok) {
                throw new Error(`Failed to fetch Apple Music page with status: ${pageResponse.status}`);
            }

            const html = await pageResponse.text();
            
            // Find the amp-ambient-video tag and extract its src
            const ampVideoRegex = /<amp-ambient-video[^>]*src="([^"]*)"[^>]*>/i;
            const match = html.match(ampVideoRegex);
            
            if (match && match[1]) {
                // Generate static album art URL from iTunes data
                const staticAlbumArt = song.artworkUrl100 
                    ? song.artworkUrl100.replace('100x100bb', '500x500bb')
                    : null;
                
                // If successful, return the data from Apple Music
                console.log("Successfully found artwork from iTunes Search + Apple Music.");
                return NextResponse.json({ 
                    source: 'apple-music',
                    code: 200,
                    videoPlayUrl: match[1],
                    albumId: albumId,
                    albumName: albumName,
                    artistName: artistName,
                    songName: song.trackName,
                    albumArt: staticAlbumArt
                });
            } else {
                // If the video tag is not found, throw an error to trigger the fallback
                throw new Error('amp-ambient-video tag not found on Apple Music page.');
            }
            
        } catch (error) {
            // Log the error from the iTunes/Apple API and proceed to the fallback
            console.warn(`iTunes/Apple Music API failed: ${error instanceof Error ? error.message : String(error)}. Trying fallback...`);
        }
    }

    // --- Step 2: Try the fallback API if the Apple API failed or was skipped ---
    if (songId) {
        try {
            console.log(`Attempting to fetch from fallback API with ID: "${songId}"`);
            const response = await fetch(`https://api.palmus.co.uk/song/dynamic/cover?id=${songId}`);
            
            if (!response.ok) {
                throw new Error(`Fallback API failed with status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.code === 200 && data.data?.videoPlayUrl) {
                // If successful, return the data from the fallback API
                console.log("Successfully found artwork from fallback API.");
                return NextResponse.json({
                    source: 'fallback-api',
                    code: 200,
                    videoPlayUrl: data.data.videoPlayUrl,
                    needTransition: data.data.needTransition || false
                });
            } else {
                 // If the fallback also has no data, return a final "not found" error
                return NextResponse.json({ error: 'Artwork not found from any source.' }, { status: 404 });
            }
        } catch (error) {
            console.error(`Fallback API failed: ${error instanceof Error ? error.message : String(error)}`);
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }
    }

    // --- Step 3: If no valid parameters were provided ---
    return NextResponse.json({ error: 'A song name or song ID parameter is required.' }, { status: 400 });
}
