import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOST = '.r2.dev';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Restrict to R2 CDN URLs only — prevents open-proxy abuse
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse('Invalid url', { status: 400 });
  }

  if (!parsed.hostname.endsWith(ALLOWED_HOST)) {
    return new NextResponse('Only R2 URLs are allowed', { status: 403 });
  }

  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) {
      return new NextResponse('Upstream error', { status: res.status });
    }

    const blob = await res.blob();
    const contentType = res.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Failed to fetch image', { status: 502 });
  }
}
