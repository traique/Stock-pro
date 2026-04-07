-- Bảng lưu dữ liệu nến realtime từ sieutinhieu
CREATE TABLE IF NOT EXISTS stock_bars (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  timeframe TEXT DEFAULT '1D',
  timestamp TIMESTAMPTZ NOT NULL,
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  close NUMERIC,
  volume BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng lưu tín hiệu mua/bán
CREATE TABLE IF NOT EXISTS stock_signals (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL, -- BUY, SELL, STRONG_BUY, STRONG_SELL
  price NUMERIC,
  ma20_value NUMERIC,
  macd_value NUMERIC,
  macd_signal NUMERIC,
  trend_change_from TEXT,
  trend_change_to TEXT,
  trading_value BIGINT,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index để query nhanh
CREATE INDEX idx_stock_bars_symbol_time ON stock_bars(symbol, timestamp DESC);
CREATE INDEX idx_stock_signals_symbol ON stock_signals(symbol);
CREATE INDEX idx_stock_signals_detected ON stock_signals(detected_at DESC);

-- Bảng portfolio realtime (kết nối với bảng cũ của bạn)
ALTER TABLE portfolio 
ADD COLUMN IF NOT EXISTS last_signal TEXT,
ADD COLUMN IF NOT EXISTS last_signal_at TIMESTAMPTZ;
