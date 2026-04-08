import { NextResponse } from 'next/server';

const SIEU_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SM-A705F Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.177 Mobile Safari/537.36',
  'Referer': 'https://sieutinhieu.vn/',
  'Accept': '*/*',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'VN30';
  const timeframe = searchParams.get('timeframe') || '1D';

  try {
    const url = `https://sieutinhieu.vn/api/v1/realtime/bar?symbol=\( {symbol}&timeframe= \){timeframe}`;

    const res = await fetch(url, { 
      headers: SIEU_HEADERS,
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Bar fetch error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch bar data" 
    }, { status: 500 });
  }
}
