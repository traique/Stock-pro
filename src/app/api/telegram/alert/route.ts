import { NextResponse } from 'next/server';

const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

export async function POST(request: Request) {
  try {
    const { symbol, signal_type, price, trading_value } = await request.json();

    if (!BOT_TOKEN || !CHAT_ID) {
      return NextResponse.json({ success: false, error: 'Telegram config missing' });
    }

    const message = `
🚨 *Stock Pro Alert*

Mã: *${symbol}*
Signal: *${signal_type}* 🔥
Giá: ${price?.toLocaleString()} 
Giá trị GD: ${(trading_value / 1e9).toFixed(1)} tỷ

Thời gian: ${new Date().toLocaleString('vi-VN')}
    `.trim();

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message });
  }
}
