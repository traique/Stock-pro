import { NextResponse } from 'next/server';

const SIEU_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SM-A705F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.177 Mobile Safari/537.36',
  'Referer': 'https://sieutinhieu.vn/',
  'Accept': '*/*',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '50';
  const signalType = searchParams.get('type') || 'BUY'; // BUY hoặc SELL

  try {
    const url = `https://sieutinhieu.vn/api/v1/realtime-signals/live-signals/today-trend-changes?limit=\( {limit}&signal_type= \){signalType}&include_all_today=false&sort_by=trading_value`;

    const res = await fetch(url, { 
      headers: SIEU_HEADERS, 
      cache: 'no-store' 
    });

    if (!res.ok) throw new Error('Failed to fetch signals');

    const data = await res.json();
    return NextResponse.json({ success: true, data, type: signalType });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
