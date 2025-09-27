import { STORAGE_KEYS } from '../constants.js';
import { readFromStorage, writeToStorage } from '../utils.storage.js';

const sanitizeFilter = (filter) => ({
  name: String(filter.name || '').trim(),
  query: filter.query || '',
  category: filter.category || '',
  sortBy: filter.sortBy || 'publishedAt',
  timeRange: filter.timeRange || 'all',
  pageSize: Number(filter.pageSize) || 9,
});

export const createSavedFiltersStore = async () => {
  const storedFilters = (await readFromStorage(STORAGE_KEYS.savedFilters, [])) || [];
  let filters = storedFilters.map(sanitizeFilter).filter((filter) => filter.name);
  const subscribers = new Set();

  const commit = () => {
    writeToStorage(STORAGE_KEYS.savedFilters, filters).catch((error) =>
      console.warn('Gagal menyimpan filter tersimpan', error),
    );
    subscribers.forEach((callback) => callback(filters));
  };

  return {
    getAll: () => filters.slice(),
    subscribe: (callback) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    add: (filter) => {
      const sanitized = sanitizeFilter(filter);
      if (!sanitized.name) return false;
      const exists = filters.findIndex((item) => item.name.toLowerCase() === sanitized.name.toLowerCase());
      if (exists >= 0) {
        filters[exists] = sanitized;
      } else {
        filters.push(sanitized);
      }
      commit();
      return true;
    },
    remove: (name) => {
      const before = filters.length;
      filters = filters.filter((item) => item.name.toLowerCase() !== name.toLowerCase());
      if (filters.length !== before) {
        commit();
      }
    },
    clear: () => {
      filters = [];
      commit();
    },
  };
};
