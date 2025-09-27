import axios from 'axios';
import createHttpError from 'http-errors';
import NodeCache from 'node-cache';
import { appConfig } from '../config/env';

type NewsQuery = {
  query: string;
  category?: string;
  page: number;
  pageSize: number;
};

type GNewsArticle = {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  publishedAt: string;
  source: {
    name: string;
  };
};

type GNewsResponse = {
  totalArticles: number;
  articles: GNewsArticle[];
};

const topicMap: Record<string, string> = {
  business: 'business',
  technology: 'technology',
  sports: 'sports',
  health: 'health',
};

const cache = new NodeCache({
  stdTTL: appConfig.newsCacheTtlSeconds,
  checkperiod: Math.max(30, Math.round(appConfig.newsCacheTtlSeconds / 2)),
  useClones: false,
});

export type NewsResult = {
  totalArticles: number;
  articles: GNewsArticle[];
  cached: boolean;
};

const buildCacheKey = ({ query, category, page, pageSize }: NewsQuery): string =>
  [query || 'default', category || 'all', page, pageSize].join('::');

export async function fetchNews(query: NewsQuery): Promise<NewsResult> {
  const sanitizedQuery = query.query.trim() || 'berita';
  const sanitizedCategory = query.category?.trim().toLowerCase();
  const page = Number.isFinite(query.page) && query.page > 0 ? query.page : 1;
  const pageSize = Number.isFinite(query.pageSize) && query.pageSize > 0 ? query.pageSize : appConfig.defaultPageSize;

  const cacheKey = buildCacheKey({ query: sanitizedQuery, category: sanitizedCategory, page, pageSize });
  const cached = cache.get<NewsResult>(cacheKey);
  if (cached) {
    return { ...cached, cached: true };
  }

  if (!appConfig.gnews.apiKey) {
    throw createHttpError(500, 'Konfigurasi API key GNews belum disetel. Tambahkan variabel lingkungan GNEWS_API_KEY.');
  }

  const params: Record<string, string | number> = {
    q: sanitizedQuery,
    lang: appConfig.gnews.language,
    max: pageSize,
    page,
    token: appConfig.gnews.apiKey,
  };

  if (sanitizedCategory && topicMap[sanitizedCategory]) {
    params.topic = topicMap[sanitizedCategory];
  }

  try {
    const response = await axios.get<GNewsResponse>(`${appConfig.gnews.baseUrl}/search`, { params, timeout: 7000 });
    const payload: NewsResult = {
      totalArticles: response.data.totalArticles ?? response.data.articles.length,
      articles: response.data.articles,
      cached: false,
    };
    cache.set(cacheKey, payload);
    return payload;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? 502;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Gagal menghubungi layanan berita.';
      throw createHttpError(status, message);
    }
    throw createHttpError(500, 'Terjadi kesalahan tidak terduga saat mengambil berita.');
  }
}
