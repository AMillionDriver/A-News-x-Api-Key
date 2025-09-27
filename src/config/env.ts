import { config as loadEnv } from 'dotenv';
import path from 'path';

const resolvedEnvPath = process.env.DOTENV_CONFIG_PATH
  ? path.resolve(process.cwd(), process.env.DOTENV_CONFIG_PATH)
  : undefined;

loadEnv(resolvedEnvPath ? { path: resolvedEnvPath } : undefined);

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const appConfig = {
  env: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 4173),
  defaultPageSize: toNumber(process.env.DEFAULT_PAGE_SIZE, 9),
  newsCacheTtlSeconds: toNumber(process.env.NEWS_CACHE_TTL, 300),
  gnews: {
    baseUrl: process.env.GNEWS_API_BASE_URL ?? 'https://gnews.io/api/v4',
    apiKey: process.env.GNEWS_API_KEY ?? '',
    language: process.env.GNEWS_LANGUAGE ?? 'id',
  },
};
