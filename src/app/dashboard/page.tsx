'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Home as HomeIcon, ListOrdered, Sun, Moon, BarChart2 } from 'lucide-react';
import Link from 'next/link';

// Hàm siêu việt: Gọi API có tích hợp tự động ngắt kết nối (Chống treo vòng lặp)
const fetchWithTimeout = async (url: string, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export default function Dashboard() {
  const [symbolInput, setSymbolInput] = useState('SSI');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const fetchPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbolInput) return;
    setLoading(true); 
    setError('');
    
    try {
      const symbol = symbolInput.toUpperCase();

      // Gọi API lấy dữ liệu hiệu suất (Chờ tối đa 8 giây)
      const resPerf = await fetchWithTimeout(`/api/sieutinhieu/performance?symbol=${symbol}`, 8000);
      const jsonPerf = await resPerf.json();

      // Cập nhật giao diện
      if (jsonPerf.success && jsonPerf.data) {
        setPerformanceData(jsonPerf.data);
      } else {
        setError('Không tìm thấy dữ liệu.');
      }
    } catch (err: any) { 
      if (err.name === 'AbortError') {
        setError('Máy chủ phản hồi quá lâu. Vui lòng thử lại.');
      } else {
        setError('Lỗi kết nối mạng hoặc máy chủ từ chối.');
      }
    } finally { 
      setLoading(false); 
    }
  };

  const latestTrade = performanceData?.trades?.[0];
  const isBuy = latestTrade?.side === 'BUY';

  const formatDate = (ts: number) => {
    if (!ts) return '---';
    return new Date(ts * 1000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="bento-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '40px' }}>
          Stock Pro<span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginLeft: '8px' }}>Analytics.</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="nav-menu" style={{ marginBottom: 0 }}>
            <Link href="/" className="nav-link"><HomeIcon size={16} /> Tín hiệu</Link>
            <Link href="/dashboard" className="nav-link active"><Search size={16} /> Phân tích</Link>
          </div>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>

      {/* Form tìm kiếm */}
      <form onSubmit={fetchPerformance} style={{ position: 'relative', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
        <Search style={{ position: 'absolute', left: '18px', top: '16px', color: 'var(--text-secondary)' }} size={22} />
        <input 
          type="text" 
          className="editorial-input"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
          placeholder="Nhập mã cổ phiếu (VD: SSI, SHS, BSR)..."
        />
        <button type="submit" className="editorial-btn" style={{ position: 'absolute', right: '8px', top: '8px', bottom: '8px' }}>
          Tìm kiếm
        </button>
      </form>

      {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Đang thu thập dữ liệu...</p>}
      {error && <p style={{ textAlign: 'center', color: 'var(--accent-red)' }}>{error}</p>}

      {/* Result */}
      {performanceData && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* KHỐI 1: CHỈ SỐ THỐNG KÊ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>Trạng thái hiện tại</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '16px', borderRadius: '50%', border: `1px solid ${isBuy ? 'var(--accent-green)' : 'var(--accent-red)'}` }}>
                  {isBuy ? <ArrowUpRight size={32} color="var(--accent-green)" /> : <ArrowDownRight size={32} color="var(--accent-red)" />}
                </div>
                <div>
                  <div style={{ fontSize: '36px', fontFamily: "'Playfair Display', serif", color: isBuy ? 'var(--accent-green)' : 'var(--accent-red)', lineHeight: '1' }}>
                    {isBuy ? 'BUY' : 'SELL'}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Vùng giá: <strong style={{ color: 'var(--text-primary)' }}>{latestTrade?.entry_price}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{ fontSize: '40px', fontFamily: "'Playfair Display', serif" }}>{performanceData.win_rate?.toFixed(0)}<span style={{ fontSize: '20px', color: 'var(--text-secondary)' }}>%</span></div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Tỷ lệ thắng</div>
              </div>
              <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                <div style={{ fontSize: '40px', fontFamily: "'Playfair Display', serif", color: performanceData.total_pnl_pct > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {performanceData.total_pnl_pct > 0 ? '+' : ''}{performanceData.total_pnl_pct?.toFixed(0)}<span style={{ fontSize: '20px' }}>%</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px' }}>Lợi nhuận</div>
              </div>
            </div>
          </div>

          {/* KHỐI 2: BIỂU ĐỒ VNDIRECT (KHÔNG BỊ CHẶN, ĐẦY ĐỦ CÔNG CỤ TRADINGVIEW) */}
          <div className="bento-card" style={{ padding: '0', overflow: 'hidden', height: '600px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-color)' }}>
              <BarChart2 size={20} color="var(--text-secondary)" /> 
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Biểu đồ Kỹ thuật ({performanceData.symbol})</h3>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              <iframe 
                src={`https://dchart.vndirect.com.vn/?symbol=${performanceData.symbol}`} 
                style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }}
                title={`Biểu đồ Phân tích ${performanceData.symbol}`}
                allowFullScreen
              />
            </div>
          </div>

          {/* KHỐI 3: LỊCH SỬ LỆNH */}
          <div className="bento-card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)' }}>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><ListOrdered size={20} color="var(--text-secondary)" /> Lịch sử lệnh ({performanceData.symbol})</h3>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{performanceData.trades?.length || 0} lệnh</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>Loại</th>
                    <th style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>Ngày vào</th>
                    <th style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>Giá vào</th>
                    <th style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>Ngày ra</th>
                    <th style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>Giá ra</th>
                    <th style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Kết quả</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.trades?.map((trade: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '20px 24px' }}><span className={`badge ${trade.side === 'BUY' ? 'buy' : 'sell'}`}>{trade.side}</span></td>
                      <td style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>{formatDate(trade.entry_ts)}</td>
                      <td style={{ padding: '20px 24px', fontWeight: '600' }}>{trade.entry_price}</td>
                      <td style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>{formatDate(trade.exit_ts)}</td>
                      <td style={{ padding: '20px 24px', fontWeight: '600' }}>{trade.exit_price || '---'}</td>
                      <td style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '700', color: trade.pnl_pct > 0 ? 'var(--accent-green)' : trade.pnl_pct < 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                        {trade.pnl_pct > 0 ? '+' : ''}{trade.pnl_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
