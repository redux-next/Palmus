import { NextResponse } from 'next/server';
import genreData from './genre.json';

// 遞迴查找流派 ID
function findGenreById(genres: any[], id: string): any {
    for (const genre of genres) {
        if (genre.id.toString() === id) {
            return genre;
        }
        if (genre.children) {
            const found = findGenreById(genre.children, id);
            if (found) return found;
        }
    }
    return null;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
        return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    try {
        const res = await fetch(`https://api.palmus.co.uk/song/wiki/summary?id=${id}`);
        const json = await res.json();
        let genreTagId: string | null = null;
        
        // 尋找 code 為 SONG_PLAY_ABOUT_SONG_BASIC 的 block
        const basicBlock = (json?.data?.blocks || []).find(
            (block: any) => block.code === 'SONG_PLAY_ABOUT_SONG_BASIC'
        );
        
        if (basicBlock && Array.isArray(basicBlock.creatives)) {
            for (const creative of basicBlock.creatives) {
                for (const resource of creative.resources || []) {
                    if (resource.resourceType === "melody_style") {
                        const targetUrl = resource.uiElement?.mainTitle?.action?.clickAction?.targetUrl;
                        const match = targetUrl ? targetUrl.match(/tagId=(\d+)/) : null;
                        const styleId = match ? match[1] : null;
                        if (styleId) {
                            genreTagId = styleId;
                            break;
                        }
                    }
                }
                if (genreTagId) break;
            }
        }

        if (!genreTagId) {
            return NextResponse.json({ error: 'TagId not found' }, { status: 404 });
        }

        // 查找對應的流派資訊
        const genreInfo = findGenreById(genreData, genreTagId);
        
        return NextResponse.json({
            id: id,
            genre: {
                id: genreTagId,
                name: genreInfo?.name || 'Unknown',
                cover: genreInfo?.cover || null
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
