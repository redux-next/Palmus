import { NextRequest, NextResponse } from 'next/server';

// 檢查歌詞是否只包含元數據
function isLyricsOnlyMetadata(lrcContent: string): boolean {
  if (!lrcContent) return true;
  
  const lines = lrcContent.split('\n');
  let hasValidLyrics = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // 檢查是否為時間戳行格式 [mm:ss.xx]
    const timeRegex = /^\[(\d{2,}):(\d{2})\.(\d{2,3})\]/;
    const match = trimmedLine.match(timeRegex);
    
    if (match) {
      const timestamp = match[0];
      const content = trimmedLine.substring(timestamp.length).trim();
      
      // 如果內容為空，跳過
      if (!content) continue;
      
      try {
        // 嘗試解析內容是否為 JSON 元數據
        const parsed = JSON.parse(content);
        
        // 如果是包含 't' 和 'c' 的元數據對象，跳過
        if (parsed && typeof parsed === 'object' && 'c' in parsed) {
          continue;
        }
        
        // 如果是其他格式的 JSON，也視為無效歌詞
        if (parsed && typeof parsed === 'object') {
          continue;
        }
          // 如果不是 JSON，視為有效歌詞
        hasValidLyrics = true;
        break;
      } catch {
        // 不是 JSON 格式，視為有效歌詞
        hasValidLyrics = true;
        break;
      }
    } else {
      // 不是時間戳格式的行，如果不為空則視為有效內容
      if (trimmedLine.length > 0) {
        hasValidLyrics = true;
        break;
      }
    }
  }
  
  return !hasValidLyrics;
}

// 清理 LRC 歌詞中的 JSON 元數據
function cleanLrcLyrics(lrcContent: string): string {
  if (!lrcContent) return lrcContent;
  
  // 按行分割歌詞
  const lines = lrcContent.split('\n');
  const cleanedLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // 檢查是否為時間戳行格式 [mm:ss.xx]
    const timeRegex = /^\[(\d{2,}):(\d{2})\.(\d{2,3})\]/;
    const match = trimmedLine.match(timeRegex);
    
    if (match) {
      // 提取時間戳後的內容
      const timestamp = match[0];
      const content = trimmedLine.substring(timestamp.length);
      
      try {
        // 嘗試解析內容是否為 JSON
        const parsed = JSON.parse(content);
        
        // 如果是包含 't' 和 'c' 的元數據對象，跳過這行
        if (parsed && typeof parsed === 'object' && 'c' in parsed) {
          console.log('跳過元數據行:', trimmedLine);
          continue;
        }
          // 如果是其他 JSON 格式但不是元數據，保留原行
        cleanedLines.push(trimmedLine);
      } catch {
        // 不是 JSON 格式，保留原行
        cleanedLines.push(trimmedLine);
      }
    } else {
      // 不是時間戳格式的行，保留原行
      cleanedLines.push(trimmedLine);
    }
  }
  
  return cleanedLines.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }
    
    const response = await fetch(`https://api.palmus.co.uk/lyric/new?id=${id}`);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch lyrics' }, { status: response.status });
    }
    
    const data = await response.json();
    
    if (!data) {
      return NextResponse.json({ error: 'data not found' }, { status: 404 });
    }
    
    // 檢查並清理 LRC 歌詞
    let cleanedLrc = data.lrc;
    if (data.lrc?.lyric) {
      // 檢查是否只包含元數據
      if (isLyricsOnlyMetadata(data.lrc.lyric)) {
        console.log('LRC 歌詞只包含元數據，設為 null');
        cleanedLrc = null;
      } else {
        // 清理元數據但保留有效歌詞
        cleanedLrc = {
          ...data.lrc,
          lyric: cleanLrcLyrics(data.lrc.lyric)
        };
      }
    }
    
    // 檢查並清理翻譯歌詞
    let cleanedTlyric = data.tlyric;
    if (data.tlyric?.lyric) {
      if (isLyricsOnlyMetadata(data.tlyric.lyric)) {
        console.log('翻譯歌詞只包含元數據，設為 null');
        cleanedTlyric = null;
      } else {
        cleanedTlyric = {
          ...data.tlyric,
          lyric: cleanLrcLyrics(data.tlyric.lyric)
        };
      }
    }
    
    return NextResponse.json({ 
      lrc: cleanedLrc,
      yrc: data.yrc || null,
      tlyric: cleanedTlyric
    });
  } catch (error) {
    console.error('Lyrics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
