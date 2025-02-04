import { NextResponse } from 'next/server'

// 新增輔助函式以產生隨機 IP 及 User-Agent
function generateRandomIP(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.');
}

function getRandomUserAgent(): string {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'Mozilla/5.0 (X11; Linux x86_64)',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
    'Mozilla/5.0 (Android 11; Mobile; rv:89.0)'
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const br = searchParams.get('quality')

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    // 產生隨機 header 的值
    const randomIP = generateRandomIP();
    const randomUA = getRandomUserAgent();

    const url = `https://www.hhlqilongzhu.cn/api/dg_wyymusic.php?id=${id}&type=json&br=${br}`;
    const response = await fetch(url, {
      headers: {
        'X-Forwarded-For': randomIP,
        'X-Real-IP': randomIP,
        'User-Agent': randomUA
      }
    });
    const data = await response.json()
    
    // 修改 music_url：僅保留副檔名前的內容
    if (data.music_url) {
      const m = data.music_url.match(/^(.*\.(?:mp3|wav|flac|mp4|m4a))/i);
      if (m) data.music_url = m[1];
    }
    
    // 刪除 id 和 link 屬性
    delete data.id;
    delete data.link;
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching playlist:', error)
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 })
  }
}
