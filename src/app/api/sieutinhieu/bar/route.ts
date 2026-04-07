import { NextResponse } from 'next/server';

const SIEU_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SM-A705F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.177 Mobile Safari/537.36',
  'Referer': 'https://sieutinhieu.vn/',
  'Accept': '*/*',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'VN30';
  const timeframe = searchParams.get('timeframe') || '1D';

  try {
    const res = await fetch(
      `https://sieutinhieu.vn/api/v1/realtime/bar?symbol=\( {symbol}&timeframe= \){timeframe}`,
      { headers: SIEU_HEADERS, cache: 'no-store' }
    );

    if (!res.ok) throw new Error('Failed to fetch bar');

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
