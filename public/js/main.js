import {
  CATEGORY_OPTIONS,
  PAGE_SIZE_OPTIONS,
  SORT_OPTIONS,
  TIME_RANGE_OPTIONS,
} from './constants.js';
import { createNewsClient } from './services.newsClient.js';
import { createPreferencesStore } from './state.preferences.js';
import { createSavedFiltersStore } from './state.filters.js';
import {
  renderArticles,
  renderFeaturedArticle,
  renderNicheFocus,
  renderSavedFilters,
  renderSkeletons,
  renderStats,
  renderTrendingTopics,
  updateStatusBanner,
  updateViewToggle,
} from './ui.renderers.js';
import { preferReducedMotion, qsa, qs, setHidden, toggleClass } from './utils.dom.js';

const newsClient = createNewsClient();
const preferencesStore = createPreferencesStore();
const savedFiltersStore = createSavedFiltersStore();

const elements = {
  newsGrid: qs('#newsGrid'),
  loadingIndicator: qs('#loadingIndicator'),
  errorMessage: qs('#errorMessage'),
  noResultsMessage: qs('#noResultsMessage'),
  searchForm: qs('#searchForm'),
  searchInput: qs('#searchInput'),
  categorySelect: qs('#categorySelect'),
  sortBySelect: qs('#sortBySelect'),
  timeRangeSelect: qs('#timeRangeSelect'),
  pageSizeSelect: qs('#pageSizeSelect'),
  prevPage: qs('#prevPage'),
  nextPage: qs('#nextPage'),
  pageInfo: qs('#pageInfo'),
  resultSummary: qs('#resultSummary'),
  featuredArticle: qs('#featuredArticle'),
  totalArticlesStat: qs('#totalArticlesStat'),
  activeFiltersStat: qs('#activeFiltersStat'),
  lastUpdatedStat: qs('#lastUpdatedStat'),
  trendingTopics: qs('#trendingTopics'),
  refreshTrending: qs('#refreshTrending'),
  darkModeToggle: qs('#darkModeToggle'),
  mobileMenuButton: qs('#mobileMenuButton'),
  mobileMenu: qs('#mobileMenu'),
  quickFilters: qsa('.quick-filter'),
  categoryPills: qsa('.category-pill'),
  viewToggle: qs('#viewToggle'),
  savedFiltersList: qs('#savedFiltersList'),
  saveCurrentFilter: qs('#saveCurrentFilter'),
  savedFilterName: qs('#savedFilterName'),
  clearSavedFilters: qs('#clearSavedFilters'),
  nicheTopics: qs('#nicheTopics'),
  statusBanner: qs('#statusBanner'),
  offlineBadge: qs('#offlineBadge'),
};

const uiState = {
  page: 1,
  totalResults: 0,
  articles: [],
  lastUpdated: null,
  latestQuery: '',
  isLoading: false,
};

const applyTheme = (theme = 'system') => {
  const root = document.documentElement;
  let resolved = theme;
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.classList.toggle('dark', resolved === 'dark');
  elements.darkModeToggle?.setAttribute('aria-pressed', resolved === 'dark');
  const icon = resolved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  const label = resolved === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap';
  elements.darkModeToggle?.setAttribute('title', label);
  elements.darkModeToggle?.setAttribute('aria-label', label);
  if (elements.darkModeToggle?.firstElementChild) {
    elements.darkModeToggle.firstElementChild.className = icon;
  }
};

const fillSelectOptions = () => {
  if (elements.categorySelect) {
    elements.categorySelect.innerHTML = CATEGORY_OPTIONS.map(
      (option) => `<option value="${option.value}">${option.label}</option>`,
    ).join('');
  }
  if (elements.sortBySelect) {
    elements.sortBySelect.innerHTML = SORT_OPTIONS.map(
      (option) => `<option value="${option.value}">${option.label}</option>`,
    ).join('');
  }
  if (elements.timeRangeSelect) {
    elements.timeRangeSelect.innerHTML = TIME_RANGE_OPTIONS.map(
      (option) => `<option value="${option.value}">${option.label}</option>`,
    ).join('');
  }
  if (elements.pageSizeSelect) {
    elements.pageSizeSelect.innerHTML = PAGE_SIZE_OPTIONS.map(
      (value) => `<option value="${value}">${value} / halaman</option>`,
    ).join('');
  }
};

const resetFeedback = () => {
  setHidden(elements.errorMessage, true);
  setHidden(elements.noResultsMessage, true);
};

const showError = (message) => {
  if (!elements.errorMessage) return;
  elements.errorMessage.textContent = message;
  setHidden(elements.errorMessage, false);
  setHidden(elements.noResultsMessage, true);
};

const showNoResults = () => {
  if (!elements.noResultsMessage) return;
  setHidden(elements.noResultsMessage, false);
  setHidden(elements.errorMessage, true);
  if (elements.resultSummary) {
    elements.resultSummary.textContent = 'Tidak ada artikel untuk filter yang dipilih.';
  }
  renderFeaturedArticle(elements.featuredArticle, null);
  renderArticles({ container: elements.newsGrid, articles: [], viewMode: preferencesStore.getState().viewMode });
};

const updatePagination = () => {
  const { pageSize, viewMode } = preferencesStore.getState();
  const totalPages = Math.max(1, Math.ceil(uiState.totalResults / pageSize));
  elements.prevPage?.setAttribute('aria-disabled', uiState.page <= 1);
  elements.nextPage?.setAttribute('aria-disabled', uiState.page >= totalPages);
  elements.prevPage?.classList.toggle('opacity-50', uiState.page <= 1);
  elements.nextPage?.classList.toggle('opacity-50', uiState.page >= totalPages);
  if (elements.prevPage) elements.prevPage.disabled = uiState.page <= 1;
  if (elements.nextPage) elements.nextPage.disabled = uiState.page >= totalPages;
  if (elements.pageInfo) {
    elements.pageInfo.textContent = `Halaman ${uiState.page} dari ${totalPages}`;
  }
  if (elements.resultSummary) {
    const showingFrom = (uiState.page - 1) * pageSize + 1;
    const showingTo = Math.min(uiState.page * pageSize, uiState.totalResults);
    if (uiState.totalResults === 0) {
      elements.resultSummary.textContent = 'Tidak ada artikel untuk filter yang dipilih.';
    } else {
      elements.resultSummary.textContent = `Menampilkan ${showingFrom} - ${showingTo} dari ${uiState.totalResults.toLocaleString('id-ID')} artikel`;
    }
  }
  const activeFilters = [uiState.latestQuery || 'Semua berita', preferencesStore.getState().category || 'Semua kategori'];
  if (preferencesStore.getState().timeRange && preferencesStore.getState().timeRange !== 'all') {
    activeFilters.push(`Rentang ${preferencesStore.getState().timeRange}`);
  }
  renderStats({
    totalArticlesStat: elements.totalArticlesStat,
    activeFiltersStat: elements.activeFiltersStat,
    lastUpdatedStat: elements.lastUpdatedStat,
    total: uiState.totalResults,
    activeFilters: activeFilters.join(' • '),
    lastUpdated: uiState.lastUpdated,
  });
  updateViewToggle(elements.viewToggle, viewMode);
};

const showLoading = () => {
  uiState.isLoading = true;
  setHidden(elements.loadingIndicator, false);
  resetFeedback();
  renderSkeletons(elements.newsGrid, preferencesStore.getState().viewMode, preferencesStore.getState().pageSize);
};

const hideLoading = () => {
  uiState.isLoading = false;
  setHidden(elements.loadingIndicator, true);
};

const applyShareListeners = () => {
  qsa('.share-button').forEach((button) => {
    button.addEventListener('click', async () => {
      const url = button.dataset.url;
      const title = button.dataset.title || 'Berita menarik di NewsApp';
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
          updateStatusBanner(elements.statusBanner, {
            online: true,
            tone: 'success',
            message: 'Tautan berhasil dibagikan!',
          });
          setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1800);
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
        }
      }
      try {
        await navigator.clipboard.writeText(url);
        updateStatusBanner(elements.statusBanner, {
          online: true,
          tone: 'success',
          message: 'Tautan disalin ke papan klip.',
        });
        setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1800);
      } catch (error) {
        updateStatusBanner(elements.statusBanner, {
          online: true,
          tone: 'error',
          message: 'Gagal menyalin tautan. Silakan salin manual.',
        });
      }
    });
  });
};

const hydrateFormFromPreferences = () => {
  const preferences = preferencesStore.getState();
  if (elements.categorySelect) elements.categorySelect.value = preferences.category;
  if (elements.sortBySelect) elements.sortBySelect.value = preferences.sortBy;
  if (elements.timeRangeSelect) elements.timeRangeSelect.value = preferences.timeRange;
  if (elements.pageSizeSelect) elements.pageSizeSelect.value = String(preferences.pageSize);
  if (elements.searchInput) elements.searchInput.value = preferences.lastQuery;
  updateViewToggle(elements.viewToggle, preferences.viewMode);
};

const applyArticles = (articles) => {
  renderArticles({ container: elements.newsGrid, articles, viewMode: preferencesStore.getState().viewMode });
  applyShareListeners();
};

const hydrateSavedFilters = () => {
  renderSavedFilters(elements.savedFiltersList, savedFiltersStore.getAll(), {
    onSelect: (filter) => {
      preferencesStore.setCategory(filter.category);
      preferencesStore.setSortBy(filter.sortBy);
      preferencesStore.setTimeRange(filter.timeRange);
      preferencesStore.setPageSize(filter.pageSize);
      preferencesStore.setLastQuery(filter.query);
      if (elements.searchInput) elements.searchInput.value = filter.query;
      hydrateFormFromPreferences();
      fetchAndRender({ page: 1 });
    },
    onDelete: (filter) => {
      savedFiltersStore.remove(filter.name);
      hydrateSavedFilters();
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'success',
        message: `Filter "${filter.name}" dihapus.`,
      });
    },
  });
};

const syncOfflineBadge = () => {
  if (!elements.offlineBadge) return;
  const online = navigator.onLine;
  toggleClass(elements.offlineBadge, 'hidden', online);
  if (!online) {
    elements.offlineBadge.textContent = 'Mode offline: menampilkan data terakhir';
  }
};

const fetchAndRender = async ({ page = uiState.page, query } = {}) => {
  const preferences = preferencesStore.getState();
  const currentQuery = typeof query === 'string' ? query : elements.searchInput?.value || preferences.lastQuery;
  uiState.page = page;
  uiState.latestQuery = currentQuery;
  preferencesStore.setLastQuery(currentQuery);

  showLoading();
  try {
    const response = await newsClient.fetchNews({
      query: currentQuery,
      category: preferences.category,
      sortBy: preferences.sortBy,
      timeRange: preferences.timeRange,
      page,
      pageSize: preferences.pageSize,
    });
    const articles = response.articles || [];
    if (!articles.length) {
      uiState.totalResults = 0;
      uiState.articles = [];
      hideLoading();
      showNoResults();
      updatePagination();
      return;
    }
    uiState.totalResults = response.totalArticles ?? articles.length;
    uiState.articles = articles;
    uiState.lastUpdated = new Date();
    hideLoading();
    resetFeedback();
    renderFeaturedArticle(elements.featuredArticle, articles[0]);
    applyArticles(articles);
    updatePagination();
  } catch (error) {
    console.error('Gagal memuat berita', error);
    hideLoading();
    if (!navigator.onLine) {
      const fallback = newsClient.getOfflineFallback();
      if (fallback?.payload?.articles?.length) {
        uiState.totalResults = fallback.payload.totalArticles ?? fallback.payload.articles.length;
        uiState.articles = fallback.payload.articles;
        uiState.lastUpdated = fallback.persistedAt ? new Date(fallback.persistedAt) : null;
        renderFeaturedArticle(elements.featuredArticle, uiState.articles[0]);
        applyArticles(uiState.articles);
        updatePagination();
        updateStatusBanner(elements.statusBanner, {
          online: false,
          tone: 'error',
          message: 'Anda sedang offline. Menampilkan cache terakhir.',
        });
        return;
      }
    }
    showError(error?.message || 'Terjadi kesalahan saat memuat berita.');
  }
};

const handleSearchSubmit = (event) => {
  event?.preventDefault();
  uiState.page = 1;
  fetchAndRender({ page: 1 });
};

const initQuickFilters = () => {
  elements.quickFilters.forEach((button) => {
    button.addEventListener('click', () => {
      const query = button.dataset.query || '';
      if (elements.searchInput) elements.searchInput.value = query;
      preferencesStore.setLastQuery(query);
      uiState.page = 1;
      fetchAndRender({ page: 1, query });
    });
  });
};

const initCategoryPills = () => {
  elements.categoryPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const category = pill.dataset.category || '';
      preferencesStore.setCategory(category);
      if (elements.categorySelect) elements.categorySelect.value = category;
      uiState.page = 1;
      fetchAndRender({ page: 1 });
    });
  });
};

const initPagination = () => {
  elements.prevPage?.addEventListener('click', () => {
    if (uiState.page <= 1 || uiState.isLoading) return;
    fetchAndRender({ page: uiState.page - 1 });
  });
  elements.nextPage?.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(uiState.totalResults / preferencesStore.getState().pageSize));
    if (uiState.page >= totalPages || uiState.isLoading) return;
    fetchAndRender({ page: uiState.page + 1 });
  });
};

const initViewToggle = () => {
  qsa('button[data-view]', elements.viewToggle).forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      preferencesStore.setViewMode(view);
      updateViewToggle(elements.viewToggle, view);
      applyArticles(uiState.articles);
    });
  });
};

const initFormHandlers = () => {
  elements.searchForm?.addEventListener('submit', handleSearchSubmit);
  elements.categorySelect?.addEventListener('change', (event) => {
    preferencesStore.setCategory(event.target.value);
    fetchAndRender({ page: 1 });
  });
  elements.sortBySelect?.addEventListener('change', (event) => {
    preferencesStore.setSortBy(event.target.value);
    fetchAndRender({ page: 1 });
  });
  elements.timeRangeSelect?.addEventListener('change', (event) => {
    preferencesStore.setTimeRange(event.target.value);
    fetchAndRender({ page: 1 });
  });
  elements.pageSizeSelect?.addEventListener('change', (event) => {
    preferencesStore.setPageSize(Number(event.target.value));
    fetchAndRender({ page: 1 });
  });
};

const initSavedFilters = () => {
  hydrateSavedFilters();
  elements.saveCurrentFilter?.addEventListener('click', () => {
    const name = elements.savedFilterName?.value?.trim() ?? '';
    if (!name) {
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'error',
        message: 'Nama filter tidak boleh kosong.',
      });
      return;
    }
    const preferences = preferencesStore.getState();
    const saved = savedFiltersStore.add({
      name,
      query: preferences.lastQuery,
      category: preferences.category,
      sortBy: preferences.sortBy,
      timeRange: preferences.timeRange,
      pageSize: preferences.pageSize,
    });
    if (saved && elements.savedFilterName) {
      elements.savedFilterName.value = '';
      hydrateSavedFilters();
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'success',
        message: `Filter "${name}" tersimpan!`,
      });
    }
  });
  elements.clearSavedFilters?.addEventListener('click', () => {
    savedFiltersStore.clear();
    hydrateSavedFilters();
    updateStatusBanner(elements.statusBanner, {
      online: true,
      tone: 'success',
      message: 'Semua filter tersimpan dihapus.',
    });
  });
};

const initThemeToggle = () => {
  applyTheme(preferencesStore.getState().theme);
  elements.darkModeToggle?.addEventListener('click', () => {
    const current = preferencesStore.getState().theme;
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    preferencesStore.setTheme(nextTheme);
    applyTheme(nextTheme);
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (preferencesStore.getState().theme === 'system') {
      applyTheme('system');
    }
  });
};

const initMobileMenu = () => {
  elements.mobileMenuButton?.addEventListener('click', () => {
    const expanded = elements.mobileMenuButton.getAttribute('aria-expanded') === 'true';
    elements.mobileMenuButton.setAttribute('aria-expanded', String(!expanded));
    toggleClass(elements.mobileMenu, 'hidden', expanded);
    if (!expanded && !preferReducedMotion()) {
      elements.mobileMenu?.animate(
        [
          { opacity: 0, transform: 'translateY(-8px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 200, easing: 'ease-out' },
      );
    }
  });
  qsa('#mobileMenu a').forEach((link) =>
    link.addEventListener('click', () => {
      elements.mobileMenuButton?.setAttribute('aria-expanded', 'false');
      toggleClass(elements.mobileMenu, 'hidden', true);
    }),
  );
};

const initTrending = () => {
  const handleIdeaSelect = (idea) => {
    if (elements.searchInput) elements.searchInput.value = idea.query;
    preferencesStore.setLastQuery(idea.query);
    uiState.page = 1;
    fetchAndRender({ page: 1, query: idea.query });
  };
  renderTrendingTopics(elements.trendingTopics, handleIdeaSelect);
  renderNicheFocus(elements.nicheTopics, handleIdeaSelect);
  elements.refreshTrending?.addEventListener('click', () => {
    renderTrendingTopics(elements.trendingTopics, handleIdeaSelect);
    updateStatusBanner(elements.statusBanner, {
      online: true,
      tone: 'success',
      message: 'Topik trending diperbarui.',
    });
    setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1500);
  });
};

const initNetworkListeners = () => {
  const syncStatus = () => {
    const online = navigator.onLine;
    syncOfflineBadge();
    updateStatusBanner(elements.statusBanner, {
      online,
      tone: online ? 'success' : 'error',
      message: online ? 'Terhubung ke internet.' : 'Koneksi terputus. Beberapa fitur dibatasi.',
    });
    if (online) {
      setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1500);
    }
  };
  window.addEventListener('online', syncStatus);
  window.addEventListener('offline', syncStatus);
  syncStatus();
};

const initAccessibility = () => {
  qsa('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href')?.slice(1);
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: preferReducedMotion() ? 'auto' : 'smooth' });
        target.focus?.({ preventScroll: true });
      }
    });
  });
};

const initApp = () => {
  fillSelectOptions();
  hydrateFormFromPreferences();
  initFormHandlers();
  initQuickFilters();
  initCategoryPills();
  initPagination();
  initViewToggle();
  initSavedFilters();
  initThemeToggle();
  initMobileMenu();
  initTrending();
  initNetworkListeners();
  initAccessibility();
  syncOfflineBadge();
  fetchAndRender({ page: 1 });
};

window.addEventListener('DOMContentLoaded', initApp);
