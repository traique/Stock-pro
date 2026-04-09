'use client';

import { useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Home as HomeIcon, ListOrdered } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [symbolInput, setSymbolInput] = useState('SSI');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPerformance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbolInput) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/sieutinhieu/performance?symbol=${symbolInput}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPerformanceData(json.data);
      } else {
        setError('Không tìm thấy dữ liệu cho mã này.');
        setPerformanceData(null);
      }
    } catch (err) {
      setError('Lỗi kết nối API.');
    } finally {
      setLoading(false);
    }
  };

  const latestTrade = performanceData?.trades?.[0];
  const isBuy = latestTrade?.side === 'BUY';

  // Hàm chuyển đổi Unix timestamp sang ngày tháng dễ nhìn (VD: 24/02/26)
  const formatDate = (timestamp: number) => {
    if (!timestamp) return '---';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  return (
    <div className="bento-container">
      {/* --- Header & Menu --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '36px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🚀 Stock Pro <span style={{ color: 'var(--accent-blue)', fontSize: '24px' }}>ANALYTICS</span>
        </h1>
        <div className="nav-menu" style={{ marginBottom: 0 }}>
          <Link href="/" className="nav-link"><HomeIcon size={18} /> Tín hiệu Live</Link>
          <Link href="/dashboard" className="nav-link active"><Search size={18} /> Phân tích</Link>
        </div>
      </div>

      {/* --- Form tìm kiếm --- */}
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

      {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>Đang phân tích dữ liệu...</p>}
      {error && <p style={{ textAlign: 'center', color: 'var(--accent-red)', padding: '20px' }}>{error}</p>}

      {/* --- Kết quả Phân tích Bento Grid --- */}
      {performanceData && !loading && (
        <>
          {/* Khối 1: Các chỉ số tổng quan */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            
            {/* Card: Trạng thái hiện tại */}
            <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', fontWeight: '700' }}>
                Trạng thái gần nhất
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '20px', background: isBuy ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.1)' }}>
                  {isBuy ? <ArrowUpRight size={40} color="var(--accent-green)" /> : <ArrowDownRight size={40} color="var(--accent-red)" />}
                </div>
                <div>
                  <div style={{ fontSize: '30px', fontWeight: '800', color: isBuy ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {isBuy ? 'STRONG BUY' : 'STRONG SELL'}
                  </div>
                  <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Vùng giá vào: <strong style={{ color: 'var(--text-primary)', fontSize: '18px' }}>{latestTrade?.entry_price}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Hiệu suất tổng */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {performanceData.win_rate?.toFixed(1)}<span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>%</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Tỷ lệ thắng</div>
              </div>

              <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: performanceData.total_pnl_pct > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {performanceData.total_pnl_pct > 0 ? '+' : ''}{performanceData.total_pnl_pct?.toFixed(1)}<span style={{ fontSize: '18px', opacity: 0.7 }}>%</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Lợi suất tổng</div>
              </div>
            </div>

          </div>

          {/* Khối 2: Bảng chi tiết lệnh (ĐÃ THÊM LẠI VÀ LÀM ĐẸP) */}
          <div className="bento-card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Tiêu đề bảng */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.01)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                 <ListOrdered size={20} color="var(--text-secondary)" /> Chi tiết lệnh ({performanceData.symbol})
              </h3>
              <span style={{ background: 'rgba(0,122,255,0.1)', color: 'var(--accent-blue)', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '700' }}>
                {performanceData.trades?.length || 0} lệnh
              </span>
            </div>

            {/* Nội dung bảng */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>#</th>
                    <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>Loại</th>
                    <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>Ngày vào</th>
                    <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>Giá vào</th>
                    <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>Ngày ra</th>
                    <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>Giá ra</th>
                    <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Lợi nhuận</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.trades?.map((trade: any, idx: number) => (
                    <tr key={idx} style={{ transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>{idx + 1}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className={`badge ${trade.side === 'BUY' ? 'buy' : 'sell'}`}>{trade.side}</span>
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: '500', fontSize: '15px' }}>{formatDate(trade.entry_ts)}</td>
                      <td style={{ padding: '16px 24px', fontWeight: '700', fontSize: '15px' }}>{trade.entry_price}</td>
                      <td style={{ padding: '16px 24px', fontWeight: '500', fontSize: '15px', color: 'var(--text-secondary)' }}>{formatDate(trade.exit_ts)}</td>
                      <td style={{ padding: '16px 24px', fontWeight: '700', fontSize: '15px' }}>{trade.exit_price || '---'}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '800', fontSize: '16px', color: trade.pnl_pct > 0 ? 'var(--accent-green)' : trade.pnl_pct < 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                        {trade.pnl_pct > 0 ? '+' : ''}{trade.pnl_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
