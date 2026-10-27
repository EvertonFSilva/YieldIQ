CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE public.asset_category AS ENUM ('FII', 'FIAGRO', 'FI_INFRA', 'STOCK');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_channel AS ENUM ('USER', 'GROUP');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_target_type AS ENUM ('ASSET', 'TREASURY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_event_type AS ENUM (
    'PRICE_VARIATION',
    'PRICE_TARGET',
    'DIVIDEND_ANNOUNCEMENT',
    'DOCUMENT_DISCLOSURE',
    'MARKET_SUMMARY'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('USER', 'PREMIUM', 'ADMINISTRATOR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.treasury_indexer AS ENUM ('SELIC', 'IPCA', 'PREFIXADO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  api_key VARCHAR(100) UNIQUE NOT NULL,
  is_whatsapp_enabled BOOLEAN DEFAULT true,
  role public.user_role DEFAULT 'USER',
  alert_quota INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_api_key ON public.users(api_key);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker VARCHAR(12) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type public.asset_category NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_ticker ON public.assets(ticker);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_metadata_gin ON public.assets USING gin(metadata);

CREATE TABLE IF NOT EXISTS public.treasury_bonds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  indexer public.treasury_indexer NOT NULL,
  rate_description VARCHAR(50) NOT NULL,
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
  channel_type public.alert_channel NOT NULL,
  destination VARCHAR(100) NOT NULL,
  target_type public.alert_target_type NOT NULL,
  target_symbol VARCHAR(100) NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON public.alert_rules(is_active, target_type);
CREATE INDEX IF NOT EXISTS idx_alert_rules_user ON public.alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_target ON public.alert_rules(target_symbol);
CREATE INDEX IF NOT EXISTS idx_alert_rules_settings_gin ON public.alert_rules USING gin(settings);

CREATE TABLE IF NOT EXISTS public.alert_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES public.alert_rules(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  destination VARCHAR(100) NOT NULL,
  target_symbol VARCHAR(100) NOT NULL,
  alert_type public.alert_event_type NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
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

CREATE TABLE IF NOT EXISTS public.request_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT NOT NULL,
  duration_ms INT NOT NULL,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_request_logs_user ON public.request_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_endpoint ON public.request_logs(endpoint);
