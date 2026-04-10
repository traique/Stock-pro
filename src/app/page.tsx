'use client';

import { useEffect, useState } from 'react';
import { Bell, Home as HomeIcon, Search, Sun, Moon } from 'lucide-react';
import Link from 'next/link';

interface Signal {
  symbol: string;
  signal_type: string;
  price: number;
  trading_value: number;
  trend_change_detected_at: string;
}

export default function Home() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  // Khởi tạo Theme (Giao diện Sáng/Tối)
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

  // Hàm gọi API lấy Tín hiệu Mua
  const fetchSignals = async () => {
    try {
      const res = await fetch('/api/sieutinhieu/signals?limit=30&type=BUY', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data?.signals) setSignals(json.data.signals);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  // Tự động làm mới dữ liệu mỗi 10 giây
  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bento-container">
      {/* --- HEADER & MENU --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '40px' }}>
          Stock Pro<span style={{ color: 'var(--accent-red)', fontStyle: 'italic', marginLeft: '8px' }}>Live.</span>
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Menu chỉ còn 2 nút: Tín hiệu & Phân tích */}
          <div className="nav-menu" style={{ marginBottom: 0 }}>
            <Link href="/" className="nav-link active"><HomeIcon size={16} /> Tín hiệu</Link>
            <Link href="/dashboard" className="nav-link"><Search size={16} /> Phân tích</Link>
          </div>
          {/* Nút chuyển đổi giao diện Sáng/Tối */}
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>

      {/* --- NỘI DUNG CHÍNH (BẢNG TÍN HIỆU) --- */}
      <div className="bento-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} color="var(--text-secondary)" /> Tín hiệu Mua mạnh hôm nay
          </h2>
          <button className="editorial-btn" onClick={fetchSignals}>Làm mới</button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Đang tải dữ liệu tín hiệu...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <th style={{ padding: '16px 8px' }}>Mã CP</th>
                  <th style={{ padding: '16px 8px' }}>Giá vào</th>
                  <th style={{ padding: '16px 8px' }}>Tín hiệu</th>
                  <th style={{ padding: '16px 8px', textAlign: 'right' }}>Thanh khoản</th>
                  <th style={{ padding: '16px 8px', textAlign: 'right' }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {/* Cột Mã Cổ Phiếu */}
                    <td style={{ padding: '24px 8px', fontSize: '18px', fontWeight: '700', fontFamily: "'Playfair Display', serif" }}>
                      {s.symbol}
                    </td>
                    
                    {/* Cột Giá Vào */}
                    <td style={{ padding: '24px 8px', fontSize: '16px', fontWeight: '500' }}>
                      {s.price?.toLocaleString('vi-VN')} đ
                    </td>
                    
                    {/* Cột Badge Tín hiệu */}
                    <td style={{ padding: '24px 8px' }}>
                      <span className="badge buy">{s.signal_type}</span>
                    </td>
                    
                    {/* Cột Thanh khoản (Tỷ VNĐ) */}
                    <td style={{ padding: '24px 8px', textAlign: 'right', fontSize: '15px' }}>
                      {(s.trading_value / 1_000_000_000).toFixed(1)} tỷ
                    </td>
                    
                    {/* Cột Thời gian */}
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
  );
}
