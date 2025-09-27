import { API_BASE_URL, STORAGE_KEYS } from '../constants.js';
import { readFromStorage, writeToStorage } from '../utils.storage.js';

const inMemoryCache = new Map();

const buildParams = (options) => {
  const params = new URLSearchParams();
  params.set('page', options.page?.toString() || '1');
  params.set('pageSize', options.pageSize?.toString() || '9');
  if (options.query) params.set('query', options.query);
  if (options.category) params.set('category', options.category);
  if (options.sortBy) params.set('sortBy', options.sortBy);
  if (options.timeRange) params.set('timeRange', options.timeRange);
  return params;
};

const cacheKey = (options) => `${options.query || 'default'}::${options.category || 'all'}::${options.sortBy || 'publishedAt'}::${options.timeRange || 'all'}::${options.page || 1}::${options.pageSize || 9}`;

export const createNewsClient = () => {
  const getOfflineFallback = () => readFromStorage(STORAGE_KEYS.cachedArticles, null);

  const persist = async (payload) => {
    try {
      await writeToStorage(STORAGE_KEYS.cachedArticles, { ...payload, persistedAt: new Date().toISOString() });
    } catch (error) {
      console.warn('Gagal menyimpan cache berita terenkripsi', error);
    }
  };

  const fetchNews = async (options) => {
    const key = cacheKey(options);
    if (inMemoryCache.has(key)) {
      return { ...inMemoryCache.get(key), cached: true };
    }

    const params = buildParams(options);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_BASE_URL}?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error((await response.text()) || 'Gagal memuat berita.');
      }

      const payload = await response.json();
      inMemoryCache.set(key, payload);
      await persist({ options, payload });
      return payload;
    } finally {
      clearTimeout(timeout);
    }
  };

  return {
    fetchNews,
    getOfflineFallback,
  };
};
