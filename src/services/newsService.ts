import axios from 'axios';
import createHttpError from 'http-errors';
import NodeCache from 'node-cache';
import { appConfig } from '../config/env';

type SortBy = 'publishedAt' | 'relevance' | 'popularity';

type TimeRange = '24h' | '48h' | '7d' | '30d' | 'all';

type NewsQuery = {
  query: string;
  category?: string;
  page: number;
  pageSize: number;
  sortBy?: SortBy | string;
  timeRange?: TimeRange | string;
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
  entertainment: 'entertainment',
  science: 'science',
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
  sortBy: SortBy;
  timeRange: TimeRange;
};

const buildCacheKey = ({ query, category, page, pageSize, sortBy, timeRange }: NewsQuery): string =>
  [query || 'default', category || 'all', page, pageSize, sortBy || 'publishedAt', timeRange || 'all'].join('::');

const sortByValues: SortBy[] = ['publishedAt', 'relevance', 'popularity'];
const timeRangeMap: Record<Exclude<TimeRange, 'all'>, number> = {
  '24h': 24,
  '48h': 48,
  '7d': 24 * 7,
  '30d': 24 * 30,
};

export async function fetchNews(query: NewsQuery): Promise<NewsResult> {
  const sanitizedQuery = query.query.trim() || 'berita';
  const sanitizedCategory = query.category?.trim().toLowerCase();
  const page = Number.isFinite(query.page) && query.page > 0 ? query.page : 1;
  const pageSize = Number.isFinite(query.pageSize) && query.pageSize > 0 ? query.pageSize : appConfig.defaultPageSize;
  const providedSortBy = (query.sortBy ?? '').toString().toLowerCase();
  const sanitizedSortBy = sortByValues.includes(providedSortBy as SortBy)
    ? (providedSortBy as SortBy)
    : 'publishedAt';
  const providedTimeRange = (query.timeRange ?? '').toString().toLowerCase();
  const sanitizedTimeRange = (['24h', '48h', '7d', '30d'].includes(providedTimeRange)
    ? (providedTimeRange as TimeRange)
    : 'all') as TimeRange;

  const cacheKey = buildCacheKey({
    query: sanitizedQuery,
    category: sanitizedCategory,
    page,
    pageSize,
    sortBy: sanitizedSortBy,
    timeRange: sanitizedTimeRange,
  });
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

  if (sanitizedSortBy) {
    params.sortby = sanitizedSortBy;
  }

  if (sanitizedTimeRange !== 'all') {
    const hours = timeRangeMap[sanitizedTimeRange as Exclude<TimeRange, 'all'>];
    if (hours) {
      const to = new Date();
      const from = new Date(to.getTime() - hours * 60 * 60 * 1000);
      params.from = from.toISOString();
      params.to = to.toISOString();
    }
  }

  try {
    const response = await axios.get<GNewsResponse>(`${appConfig.gnews.baseUrl}/search`, { params, timeout: 7000 });
    const payload: NewsResult = {
      totalArticles: response.data.totalArticles ?? response.data.articles.length,
      articles: response.data.articles,
      cached: false,
      sortBy: sanitizedSortBy,
      timeRange: sanitizedTimeRange,
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
