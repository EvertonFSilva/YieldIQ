import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import dotenv from 'dotenv';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(currentDirectory, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(8000),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['silent', 'trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  DATABASE_URL: z
    .string()
    .default(
      'postgresql://postgres.zvefxgajzububpltzafz:997307386Eve.@aws-1-sa-east-1.pooler.supabase.com:5432/postgres'
    ),

  SUPABASE_URL: z.string().url().default('https://zvefxgajzububpltzafz.supabase.co'),
  SUPABASE_SECRET_KEY: z.string().default('sb_publishable_6OF1mD6MxtU4SYIVjK9xEw_-Mu3FVoa'),
  SUPABASE_ANON_KEY: z.string().default('sb_publishable_6OF1mD6MxtU4SYIVjK9xEw_-Mu3FVoa'),
  JWT_SECRET: z.string().default('997307386Eve.'),

  B3_BASE_URL: z.string().url().default('https://sistemaswebb3-listados.b3.com.br'),
  B3_REFERER_URL: z.string().url().default('https://www.b3.com.br/'),
  B3_CACHE_TTL_MS: z.coerce.number().default(3600000),

  FNET_BASE_URL: z.string().url().default('https://fnet.bmfbovespa.com.br'),
  FNET_REFERER_URL: z
    .string()
    .url()
    .default('https://fnet.bmfbovespa.com.br/fnet/publico/abrirGerenciadorDocumentosCVM'),
  FNET_CACHE_TTL_MS: z.coerce.number().default(300000),

  YAHOO_FINANCE_BASE_URL: z.string().url().default('https://query1.finance.yahoo.com'),
  YAHOO_CACHE_TTL_MS: z.coerce.number().default(60000),

  TREASURY_BASE_URL: z.string().url().default('https://www.tesourodireto.com.br'),
  TREASURY_CACHE_TTL_MS: z.coerce.number().default(600000),

  HTTP_DEFAULT_TIMEOUT_MS: z.coerce.number().default(15000),
  USER_AGENT: z
    .string()
    .default(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ),

  WHATSAPP_AUTO_START: z
    .preprocess((value) => value === 'true' || value === true || value === '1', z.boolean())
    .default(true)
});

export type EnvironmentConfiguration = z.infer<typeof environmentSchema>;

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  process.exit(1);
}

export const environment: EnvironmentConfiguration = parsedEnvironment.data;

export const FNET_DOCUMENT_CATEGORIES = {
  administratorActs: 1,
  monthlyReport: 6,
  periodicReports: 7,
  publicOffering: 8,
  dividendNotice: 14
};
