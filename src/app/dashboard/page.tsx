'use client';

import { useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Activity, Home as HomeIcon } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [symbolInput, setSymbolInput] = useState('SSI');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbolInput) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sieutinhieu/performance?symbol=${symbolInput}`);
      const json = await res.json();
      if (json.success) setPerformanceData(json.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const latestTrade = performanceData?.trades?.[0];
  const isBuy = latestTrade?.side === 'BUY';

  return (
    <div className="bento-container">
      {/* Header & Menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '36px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🚀 Stock Pro <span style={{ color: 'var(--accent-blue)', fontSize: '24px' }}>ANALYTICS</span>
        </h1>
        <div className="nav-menu" style={{ marginBottom: 0 }}>
          <Link href="/" className="nav-link"><HomeIcon size={18} /> Tín hiệu Live</Link>
          <Link href="/dashboard" className="nav-link active"><Search size={18} /> Phân tích</Link>
        </div>
      </div>

      {/* Form tìm kiếm */}
      <form onSubmit={fetchPerformance} style={{ position: 'relative', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
        <Search style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-secondary)' }} size={20} />
        <input 
          type="text" 
          className="ios-input"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
          placeholder="Nhập mã CP (VD: SSI, HPG)..."
        />
        <button type="submit" className="ios-btn" style={{ position: 'absolute', right: '6px', top: '6px', bottom: '6px', padding: '0 20px' }}>
          Tra cứu
        </button>
      </form>

      {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Đang phân tích dữ liệu...</p>}

      {/* Kết quả Phân tích Bento Grid */}
      {performanceData && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          
          {/* Card 1: Trạng thái hiện tại */}
          <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
              Trạng thái gần nhất
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '20px', background: isBuy ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)' }}>
                {isBuy ? <ArrowUpRight size={40} color="var(--accent-green)" /> : <ArrowDownRight size={40} color="var(--accent-red)" />}
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: isBuy ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {isBuy ? 'STRONG BUY' : 'STRONG SELL'}
                </div>
                <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Vùng giá vào: <strong style={{ color: 'var(--text-primary)', fontSize: '18px' }}>{latestTrade?.entry_price}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Hiệu suất tổng (Bento nhỏ) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="bento-card" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {performanceData.win_rate?.toFixed(1)}<span style={{ fontSize: '20px' }}>%</span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: '500' }}>Tỷ lệ thắng</div>
            </div>

            <div className="bento-card" style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: performanceData.total_pnl_pct > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {performanceData.total_pnl_pct > 0 ? '+' : ''}{performanceData.total_pnl_pct?.toFixed(1)}<span style={{ fontSize: '20px' }}>%</span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: '500' }}>Lợi suất tổng</div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
