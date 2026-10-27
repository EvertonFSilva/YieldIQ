CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
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

CREATE INDEX IF NOT EXISTS idx_users_api_key ON public.users(api_key);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE TABLE IF NOT EXISTS public.assets (
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

CREATE INDEX IF NOT EXISTS idx_assets_ticker ON public.assets(ticker);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(type);

CREATE TABLE IF NOT EXISTS public.treasury_bonds (
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

CREATE INDEX IF NOT EXISTS idx_treasury_bonds_name ON public.treasury_bonds(name);

CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  channel_type VARCHAR(10) NOT NULL CHECK (channel_type IN ('USER', 'GROUP')),
  channel_destination VARCHAR(100) NOT NULL,
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('ASSET', 'TREASURY')),
  target_symbol VARCHAR(100) NOT NULL,
  variation_step_percent NUMERIC(5,2),
  price_target_min NUMERIC(12,2),
  price_target_max NUMERIC(12,2),
  notify_price BOOLEAN DEFAULT true,
  notify_dividend BOOLEAN DEFAULT true,
  notify_document BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON public.alert_rules(is_active, target_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_user ON public.alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_target ON public.alert_rules(target_symbol);

CREATE TABLE IF NOT EXISTS public.alert_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES public.alert_rules(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  channel_destination VARCHAR(100) NOT NULL,
  target_symbol VARCHAR(100) NOT NULL,
  alert_type VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  document_url TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_logs_user_sent ON public.alert_logs(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_logs_sent ON public.alert_logs(sent_at DESC);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

CREATE TABLE IF NOT EXISTS public.api_telemetry (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT,
  response_time_ms INT,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_telemetry_user ON public.api_telemetry(user_id, created_at DESC);
