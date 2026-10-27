CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  api_key VARCHAR(100) UNIQUE NOT NULL,
  is_whatsapp_enabled BOOLEAN DEFAULT true,
  privilege VARCHAR(20) DEFAULT 'user',
  rule_limit INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker VARCHAR(12) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('FII', 'FIAGRO', 'FI_INFRA')),
  tax_id VARCHAR(20),
  administrator_name VARCHAR(255),
  management_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_ticker ON assets(ticker);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);

CREATE TABLE IF NOT EXISTS asset_quotes_daily (
  id BIGSERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  close_price NUMERIC(12,2) NOT NULL,
  open_price NUMERIC(12,2),
  high_price NUMERIC(12,2),
  low_price NUMERIC(12,2),
  volume BIGINT,
  variation_percent NUMERIC(8,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_asset_quote_daily UNIQUE(asset_id, date)
);

CREATE INDEX IF NOT EXISTS idx_quotes_asset_date ON asset_quotes_daily(asset_id, date DESC);

CREATE TABLE IF NOT EXISTS asset_dividends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  payment_type VARCHAR(50) DEFAULT 'Rendimento',
  amount_per_share NUMERIC(12,6) NOT NULL,
  record_date DATE NOT NULL,
  payment_date DATE,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_asset_dividend UNIQUE(asset_id, record_date, amount_per_share)
);

CREATE INDEX IF NOT EXISTS idx_dividends_asset_date ON asset_dividends(asset_id, record_date DESC);

CREATE TABLE IF NOT EXISTS asset_documents (
  id VARCHAR(50) PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  reference_date DATE NOT NULL,
  download_url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_asset_published ON asset_documents(asset_id, published_at DESC);

CREATE TABLE IF NOT EXISTS treasury_bonds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  indexer VARCHAR(20) NOT NULL,
  profitability_rate_raw VARCHAR(50) NOT NULL,
  annual_rate NUMERIC(8,4) NOT NULL,
  unit_price NUMERIC(12,2),
  minimum_investment NUMERIC(12,2),
  maturity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_type VARCHAR(10) NOT NULL CHECK (recipient_type IN ('USER', 'GROUP')),
  recipient_destination VARCHAR(100) NOT NULL,
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('ASSET', 'TREASURY')),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  treasury_bond_id UUID REFERENCES treasury_bonds(id) ON DELETE CASCADE,
  variation_threshold_percent NUMERIC(5,2),
  price_target_min NUMERIC(12,2),
  price_target_max NUMERIC(12,2),
  target_dividend_yield NUMERIC(6,2),
  notify_price BOOLEAN DEFAULT true,
  notify_dividend BOOLEAN DEFAULT true,
  notify_material_fact BOOLEAN DEFAULT true,
  notify_report BOOLEAN DEFAULT true,
  notify_public_offering BOOLEAN DEFAULT false,
  notify_gordon_price BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(is_enabled, target_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_user ON alert_rules(user_id);

CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_destination VARCHAR(100) NOT NULL,
  alert_type VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  document_url TEXT,
  status VARCHAR(20) DEFAULT 'SENT',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_history_user_sent ON alert_history(user_id, sent_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

CREATE TABLE IF NOT EXISTS api_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT,
  response_time_ms INT,
  ip_address VARCHAR(45),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_created ON api_usage(user_id, created_at DESC);
