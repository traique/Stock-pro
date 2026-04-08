import { NextResponse } from 'next/server';

const SIEU_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 11; SM-A705F Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/146.0.7680.177 Mobile Safari/537.36',
  'Referer': 'https://sieutinhieu.vn/',
  'Accept': '*/*',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '30';
  // Đảm bảo loại tín hiệu cũng in hoa nếu API gốc cần vậy (ví dụ 'buy' thành 'BUY')
  const signalType = (searchParams.get('type') || 'BUY').toUpperCase();

  try {
    // SỬA TẠI ĐÂY: Dùng ${limit} và ${signalType}
    const url = `https://sieutinhieu.vn/api/v1/realtime-signals/live-signals/today-trend-changes?limit=${limit}&signal_type=${signalType}&include_all_today=false&sort_by=trading_value`;

    const res = await fetch(url, { 
      headers: SIEU_HEADERS,
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json({ success: true, data, type: signalType });
  } catch (error) {
    console.error("Signals fetch error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch signals" 
    }, { status: 500 });
  }
}
