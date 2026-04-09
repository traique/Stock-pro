'use client';

import { useEffect, useState } from 'react';
import { Bell, Home as HomeIcon, Search } from 'lucide-react';
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

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bento-container">
      {/* Header & Menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ fontSize: '36px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🚀 Stock Pro <span style={{ color: 'var(--accent-red)', fontSize: '24px' }}>LIVE</span>
        </h1>
        
        <div className="nav-menu">
          <Link href="/" className="nav-link active"><HomeIcon size={18} /> Tín hiệu Live</Link>
          <Link href="/dashboard" className="nav-link"><Search size={18} /> Phân tích</Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="bento-card" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell color="#FF9500" /> Tín hiệu BUY mạnh
          </h2>
          <button className="ios-btn" onClick={fetchSignals}>Cập nhật</button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Đang tải dữ liệu realtime...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <th style={{ padding: '16px 8px' }}>MÃ CP</th>
                  <th style={{ padding: '16px 8px' }}>GIÁ VÀO</th>
                  <th style={{ padding: '16px 8px' }}>TRẠNG THÁI</th>
                  <th style={{ padding: '16px 8px', textAlign: 'right' }}>GIÁ TRỊ GD</th>
                  <th style={{ padding: '16px 8px', textAlign: 'right' }}>THỜI GIAN</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '20px 8px', fontSize: '18px', fontWeight: '700' }}>{s.symbol}</td>
                    <td style={{ padding: '20px 8px', fontSize: '16px', fontWeight: '500' }}>{s.price?.toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '20px 8px' }}><span className="badge buy">{s.signal_type}</span></td>
                    <td style={{ padding: '20px 8px', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px' }}>
                      {(s.trading_value / 1_000_000_000).toFixed(1)} tỷ
                    </td>
                    <td style={{ padding: '20px 8px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      {s.trend_change_detected_at ? new Date(s.trend_change_detected_at).toLocaleTimeString('vi-VN') : '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
