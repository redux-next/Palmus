import { NextRequest } from 'next/server';
import sharp from 'sharp';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');
  const width = searchParams.get('w');

  if (!imageUrl) {
    return new Response('Missing image URL', { status: 400 });
  }

  try {
    const size = parseInt(width || '400');
    const optimizedUrl = `${imageUrl}?param=${size}y${size}`;

    // 獲取原始圖片
    const response = await fetch(optimizedUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 使用 Sharp 處理圖片
    const processedImage = await sharp(buffer)
      .webp({ 
        quality: 80,
        effort: 6,
        lossless: false,
        nearLossless: false,
        smartSubsample: true
      })
      .toBuffer();

    // 返回處理後的 WebP 圖片
    return new Response(processedImage, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return new Response('Error processing image', { status: 500 });
  }
}
