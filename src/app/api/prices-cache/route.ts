import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  
  if (!symbolsParam) {
    return NextResponse.json({ error: 'Thiếu mã chứng khoán' }, { status: 400 });
  }

  // Tách các mã cổ phiếu người dùng yêu cầu (VD: "SSI,HPG")
  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
  
  // Chuyển đổi mã chứng khoán VN sang định dạng quốc tế của Yahoo Finance (VD: SSI -> SSI.VN)
  const yahooSymbols = symbols.map(sym => {
    if (sym === 'VNINDEX') return '^VNINDEX';
    return `${sym}.VN`;
  });

  try {
    // Gọi API miễn phí của Yahoo Finance
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbols.join(',')}`, {
      cache: 'no-store' // Không lưu cache để giá luôn mới nhất
    });
    
    if (!response.ok) throw new Error('Lỗi khi gọi API Yahoo Finance');
    
    const data = await response.json();
    const results = data.quoteResponse?.result || [];

    const prices: Record<string, number> = {};
    const debug: any[] = [];

    // Lọc dữ liệu trả về cho Frontend
    results.forEach((item: any) => {
      // Cắt bỏ đuôi ".VN" để trả lại đúng mã gốc cho giao diện hiển thị
      let originalSymbol = item.symbol.replace('.VN', '').replace('^', '');
      
      const price = item.regularMarketPrice;
      const change = item.regularMarketChange;
      const pct = item.regularMarketChangePercent;

      prices[originalSymbol] = price;
      debug.push({
        symbol: originalSymbol,
        price,
        change,
        pct
      });
    });

    return NextResponse.json({ prices, debug, cached: false });
  } catch (error) {
    console.error("Lỗi cập nhật giá:", error);
    return NextResponse.json({ error: 'Hệ thống đang bận, không lấy được giá' }, { status: 500 });
  }
}
