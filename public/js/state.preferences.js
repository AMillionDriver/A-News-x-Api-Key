import { CATEGORY_OPTIONS, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, SORT_OPTIONS, STORAGE_KEYS, TIME_RANGE_OPTIONS } from './constants.js';
import { readFromStorage, writeToStorage } from './utils.storage.js';

const defaultPreferences = {
  theme: 'system',
  viewMode: 'grid',
  pageSize: DEFAULT_PAGE_SIZE,
  sortBy: SORT_OPTIONS[0].value,
  timeRange: TIME_RANGE_OPTIONS[0].value,
  category: CATEGORY_OPTIONS[0].value,
  lastQuery: '',
};

export const createPreferencesStore = () => {
  let state = { ...defaultPreferences, ...readFromStorage(STORAGE_KEYS.preferences, {}) };
  const subscribers = new Set();

  const save = () => writeToStorage(STORAGE_KEYS.preferences, state);

  const setState = (partial) => {
    state = { ...state, ...partial };
    save();
    subscribers.forEach((callback) => callback(state));
  };

  return {
    getState: () => state,
    subscribe: (callback) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    setTheme: (theme) => setState({ theme }),
    setViewMode: (viewMode) => {
      if (!['grid', 'list'].includes(viewMode)) return;
      setState({ viewMode });
    },
    setPageSize: (pageSize) => {
      const parsed = Number(pageSize);
      if (!PAGE_SIZE_OPTIONS.includes(parsed)) return;
      setState({ pageSize: parsed });
    },
    setSortBy: (sortBy) => {
      const allowed = SORT_OPTIONS.map((item) => item.value);
      if (!allowed.includes(sortBy)) return;
      setState({ sortBy });
    },
    setTimeRange: (timeRange) => {
      const allowed = TIME_RANGE_OPTIONS.map((item) => item.value);
      if (!allowed.includes(timeRange)) return;
      setState({ timeRange });
    },
    setCategory: (category) => {
      const allowed = CATEGORY_OPTIONS.map((item) => item.value);
      if (!allowed.includes(category)) return;
      setState({ category });
    },
    setLastQuery: (lastQuery) => setState({ lastQuery }),
  };
};
