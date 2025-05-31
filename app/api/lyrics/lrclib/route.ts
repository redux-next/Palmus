import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const trackName = searchParams.get('title');
  const artistName = searchParams.get('artist');
  const albumName = searchParams.get('album');
  const duration = searchParams.get('duration');
  
  if (!trackName || !artistName || !duration) {
    return NextResponse.json(
      { error: 'Missing required parameters: track_name, artist_name, duration' },
      { status: 400 }
    );
  }
  
  const durationNumber = parseInt(duration);
  const baseUrl = 'https://lrclib.net/api';
  
  try {
    // 首先嘗試精確匹配
    if (albumName) {
      const exactParams = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName,
        album_name: albumName,
        duration: duration
      });
      
      const exactResponse = await fetch(`${baseUrl}/get?${exactParams}`);
      
      if (exactResponse.ok) {
        const exactData = await exactResponse.json();
        return NextResponse.json(exactData);
      }
    }
    
    // 如果精確匹配失敗，使用搜尋方法
    const searchParams = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName
    });
    
    const searchResponse = await fetch(`${baseUrl}/search?${searchParams}`);
    
    if (!searchResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to search for lyrics' },
        { status: 404 }
      );
    }
    
    const searchResults = await searchResponse.json();
    
    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      return NextResponse.json(
        { error: 'No lyrics found' },
        { status: 404 }
      );
    }
    
    // 找到持續時間最接近的結果
    const closestMatch = searchResults.reduce((closest, current) => {
      const closestDiff = Math.abs(closest.duration - durationNumber);
      const currentDiff = Math.abs(current.duration - durationNumber);
      return currentDiff < closestDiff ? current : closest;
    });
    
    return NextResponse.json(closestMatch);
    
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
