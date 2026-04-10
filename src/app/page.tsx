'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Home as HomeIcon, ListOrdered, Sun, Moon, Bell, Activity } from 'lucide-react';

interface Signal {
  symbol: string;
  signal_type: string;
  price: number;
  trading_value: number;
  trend_change_detected_at: string;
}

// Hàm gọi API chống treo
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

export default function App() {
  // --- GLOBAL STATES ---
  const [activeTab, setActiveTab] = useState<'SIGNAL' | 'ANALYTICS'>('SIGNAL');
  const [theme, setTheme] = useState('light');

  // --- SIGNAL STATES ---
  const [signals, setSignals] = useState<Signal[]>([]);
  const [sigLoading, setSigLoading] = useState(true);

  // --- ANALYTICS STATES ---
  const [symbolInput, setSymbolInput] = useState('SSI');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState('');

  // 1. Xử lý Theme Sáng/Tối
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

  // 2. Logic Tab Tín Hiệu
  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/sieutinhieu/signals?limit=30&type=BUY', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data?.signals) setSignals(json.data.signals);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setSigLoading(false); 
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  // 3. Logic Lấy dữ liệu Phân Tích (Được tách riêng để gọi tự động)
  const loadAnalyticsData = async (symbolToFetch: string) => {
    if (!symbolToFetch) return;
    setPerfLoading(true); 
    setPerfError('');
    
    try {
      const symbol = symbolToFetch.toUpperCase();
      const resPerf = await fetchWithTimeout(`/api/sieutinhieu/performance?symbol=${symbol}`, 8000);
      const jsonPerf = await resPerf.json();

      if (jsonPerf.success && jsonPerf.data) {
        setPerformanceData(jsonPerf.data);
      } else {
        setPerfError('Không tìm thấy dữ liệu cho mã này.');
        setPerformanceData(null);
      }
    } catch (err: any) { 
      if (err.name === 'AbortError') {
        setPerfError('Máy chủ phản hồi quá lâu. Vui lòng thử lại.');
      } else {
        setPerfError('Lỗi kết nối mạng hoặc máy chủ từ chối.');
      }
      setPerformanceData(null);
    } finally { 
      setPerfLoading(false); 
    }
  };

  // Submit từ ô tìm kiếm thủ công
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAnalyticsData(symbolInput);
  };

  // 4. MỚI: Xử lý khi bấm vào 1 mã cổ phiếu ở Tab Tín Hiệu
  const handleSymbolClick = (symbol: string) => {
    setSymbolInput(symbol);            // Cập nhật ô input thành mã vừa bấm
    setActiveTab('ANALYTICS');         // Nhảy sang tab Phân tích
    loadAnalyticsData(symbol);         // Tự động kéo dữ liệu phân tích ngay lập tức
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Cuộn mượt lên đầu trang
  };

  // Helper format ngày tháng
  const formatDate = (ts: number) => {
    if (!ts) return '---';
    return new Date(ts * 1000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const latestTrade = performanceData?.trades?.[0];
  const isBuy = latestTrade?.side === 'BUY';

  return (
    <div className="bento-container">
      {/* --- SHARED HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '40px', cursor: 'pointer' }} onClick={() => setActiveTab('SIGNAL')}>
          Stock Pro
          <span style={{ color: activeTab === 'SIGNAL' ? 'var(--accent-red)' : 'var(--text-secondary)', fontStyle: 'italic', marginLeft: '8px', transition: 'color 0.3s' }}>
            {activeTab === 'SIGNAL' ? 'Live.' : 'Analytics.'}
          </span>
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* MENU ĐIỀU HƯỚNG MỚI (Segmented Control - Luôn tương phản) */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--border-color)', 
            padding: '6px', 
            borderRadius: '16px',
            gap: '4px'
          }}>
            <button 
              onClick={() => setActiveTab('SIGNAL')} 
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: activeTab === 'SIGNAL' ? 'var(--text-primary)' : 'transparent',
                color: activeTab === 'SIGNAL' ? 'var(--bg-color)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'SIGNAL' ? '700' : '500',
                fontSize: '14px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Activity size={18} /> Tín hiệu
            </button>
            <button 
              onClick={() => setActiveTab('ANALYTICS')} 
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: activeTab === 'ANALYTICS' ? 'var(--text-primary)' : 'transparent',
                color: activeTab === 'ANALYTICS' ? 'var(--bg-color)' : 'var(--text-secondary)',
                fontWeight: activeTab === 'ANALYTICS' ? '700' : '500',
                fontSize: '14px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <Search size={18} /> Phân tích
            </button>
          </div>

          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme" style={{ padding: '12px', borderRadius: '16px', background: 'var(--border-color)' }}>
            {theme === 'light' ? <Moon size={20} color="var(--text-primary)" /> : <Sun size={20} color="var(--text-primary)" />}
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* TAB TÍN HIỆU                */}
      {/* ========================================= */}
      <div style={{ display: activeTab === 'SIGNAL' ? 'block' : 'none', animation: 'fadeIn 0.3s ease-in-out' }}>
        <div className="bento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={20} color="var(--text-secondary)" /> Tín hiệu Mua mạnh hôm nay
            </h2>
            <button className="editorial-btn" onClick={fetchSignals}>Làm mới</button>
          </div>

          {sigLoading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Đang tải dữ liệu tín hiệu...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    <th style={{ padding: '16px 8px' }}>Mã CP (Bấm để PT)</th>
                    <th style={{ padding: '16px 8px' }}>Giá vào</th>
                    <th style={{ padding: '16px 8px' }}>Tín hiệu</th>
                    <th style={{ padding: '16px 8px', textAlign: 'right' }}>Thanh khoản</th>
                    <th style={{ padding: '16px 8px', textAlign: 'right' }}>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s, i) => (
                    <tr 
                      key={i} 
                      onClick={() => handleSymbolClick(s.symbol)}
                      title={`Phân tích hiệu suất mã ${s.symbol}`}
                      style={{ 
                        borderBottom: '1px solid var(--border-color)', 
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,122,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '24px 8px', fontSize: '18px', fontWeight: '700', fontFamily: "'Playfair Display', serif" }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)' }}>
                          {s.symbol} <ArrowUpRight size={16} style={{ opacity: 0.6 }} />
                        </div>
                      </td>
                      <td style={{ padding: '24px 8px', fontSize: '16px', fontWeight: '500' }}>
                        {s.price?.toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ padding: '24px 8px' }}>
                        <span className="badge buy">{s.signal_type}</span>
                      </td>
                      <td style={{ padding: '24px 8px', textAlign: 'right', fontSize: '15px' }}>
                        {(s.trading_value / 1_000_000_000).toFixed(1)} tỷ
                      </td>
                      <td style={{ padding: '24px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {s.trend_change_detected_at ? new Date(s.trend_change_detected_at).toLocaleTimeString('vi-VN') : '---'}
                      </td>
                    </tr>
                  ))}
                  {signals.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Hôm nay chưa có tín hiệu mua mới.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================= */}
      {/* TAB PHÂN TÍCH               */}
      {/* ========================================= */}
      <div style={{ display: activeTab === 'ANALYTICS' ? 'block' : 'none', animation: 'fadeIn 0.3s ease-in-out' }}>
        <form onSubmit={handleFormSubmit} style={{ position: 'relative', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
          <Search style={{ position: 'absolute', left: '18px', top: '16px', color: 'var(--text-secondary)' }} size={22} />
          <input 
            type="text" 
            className="editorial-input"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
            placeholder="Nhập mã cổ phiếu (VD: SSI, SHS, BSR)..."
            style={{ borderRadius: '24px', paddingLeft: '50px' }}
          />
          <button type="submit" className="editorial-btn" style={{ position: 'absolute', right: '8px', top: '8px', bottom: '8px', borderRadius: '16px' }}>
            Tìm kiếm
          </button>
        </form>

        {perfLoading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Đang thu thập dữ liệu...</p>}
        {perfError && <p style={{ textAlign: 'center', color: 'var(--accent-red)' }}>{perfError}</p>}

        {performanceData && !perfLoading && (
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

            {/* KHỐI 2: LỊCH SỬ LỆNH */}
            <div className="bento-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)' }}>
                <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><ListOrdered size={20} color="var(--text-secondary)" /> Lịch sử lệnh ({performanceData.symbol})</h3>
                <span style={{ color: 'var(--
