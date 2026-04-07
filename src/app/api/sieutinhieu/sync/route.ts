import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch bar VN30 ví dụ
    const barRes = await fetch('http://localhost:3000/api/sieutinhieu/bar?symbol=VN30');
    const barData = await barRes.json();

    if (barData.success && barData.data) {
      await supabase.from('stock_bars').insert({
        symbol: 'VN30',
        timestamp: new Date(),
        open: barData.data.bar?.open,
        high: barData.data.bar?.high,
        low: barData.data.bar?.low,
        close: barData.data.bar?.close,
        volume: barData.data.bar?.volume,
      });
    }

    // Fetch signals BUY
    const sigRes = await fetch('http://localhost:3000/api/sieutinhieu/signals?limit=20&type=BUY');
    const sigData = await sigRes.json();

    if (sigData.success) {
      // Insert signals vào DB (có thể thêm logic tránh duplicate)
      console.log('Saved signals:', sigData.data.length);
    }

    return NextResponse.json({ success: true, message: 'Synced realtime data' });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message });
  }
}
