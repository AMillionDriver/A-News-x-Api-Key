import {
  CATEGORY_OPTIONS,
  COMMAND_ACTIONS,
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
  renderSecurityHighlights,
  renderStats,
  renderTrendingTopics,
  updateStatusBanner,
  updateViewToggle,
  updateDensityToggle,
} from './ui.renderers.js';
import { preferReducedMotion, qsa, qs, setHidden, toggleClass } from './utils.dom.js';
import { generateIntegrityHash, isSecureStorageSupported, maskFingerprint } from './utils.security.js';

const newsClient = createNewsClient();
let preferencesStore;
let savedFiltersStore;

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
  densityToggle: qs('#densityToggle'),
  refreshArticles: qs('#refreshArticles'),
  commandPalette: qs('#commandPalette'),
  commandPaletteButton: qs('#commandPaletteButton'),
  commandPaletteOverlay: qs('#commandPaletteOverlay'),
  commandPaletteClose: qs('#commandPaletteClose'),
  commandPaletteSearch: qs('#commandPaletteSearch'),
  commandPaletteList: qs('#commandPaletteList'),
  backToTop: qs('#backToTop'),
  scrollProgress: qs('#scrollProgress'),
  securityHighlights: qs('#securityHighlights'),
  securityStatusBadge: qs('#securityStatusBadge'),
  securityFingerprint: qs('#securityFingerprint'),
  securityUpdatedAt: qs('#securityUpdatedAt'),
  securitySupportMessage: qs('#securitySupportMessage'),
  integrityStatus: qs('#integrityStatus'),
  integrityCheckButton: qs('#integrityCheckButton'),
  copyFingerprintButton: qs('#copyFingerprintButton'),
};

const uiState = {
  page: 1,
  totalResults: 0,
  articles: [],
  lastUpdated: null,
  latestQuery: '',
  isLoading: false,
};

const commandPaletteState = {
  isOpen: false,
  items: COMMAND_ACTIONS.slice(),
  filtered: COMMAND_ACTIONS.slice(),
  activeIndex: 0,
  returnFocusTo: null,
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

const securityState = {
  supported: isSecureStorageSupported(),
  fingerprint: '',
  lastIntegrityHash: '',
  lastIntegrityCheck: null,
  lastPreferencesUpdate: null,
};

const formatTimestamp = (date) => {
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }).format(date);
};

const computeCommandItems = () => {
  const resolvedTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const preferences = preferencesStore?.getState?.() || { density: 'comfortable', viewMode: 'grid' };
  const { density, viewMode } = preferences;
  return COMMAND_ACTIONS.map((action) => {
    const item = { ...action };
    switch (action.id) {
      case 'toggle-theme':
        item.title = resolvedTheme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap';
        item.description =
          resolvedTheme === 'dark'
            ? 'Beralih ke antarmuka terang untuk suasana yang lebih cerah.'
            : 'Aktifkan mode gelap agar mata lebih nyaman saat malam hari.';
        break;
      case 'toggle-density':
        item.title = density === 'compact' ? 'Gunakan ruang lega' : 'Gunakan mode padat';
        item.description =
          density === 'compact'
            ? 'Kembalikan jarak antar kartu agar tampilan lebih lega.'
            : 'Padatkan kartu supaya lebih banyak berita dalam satu layar.';
        break;
      case 'view-grid':
        item.disabled = viewMode === 'grid';
        if (item.disabled) {
          item.description = 'Saat ini Anda sudah menggunakan tampilan grid.';
        }
        break;
      case 'view-list':
        item.disabled = viewMode === 'list';
        if (item.disabled) {
          item.description = 'Saat ini Anda sudah menggunakan tampilan daftar.';
        }
        break;
      case 'run-integrity-check':
        if (securityState.lastIntegrityCheck) {
          item.description = `Fingerprint terakhir diperbarui ${formatTimestamp(securityState.lastIntegrityCheck)}.`;
        }
        break;
      default:
        break;
    }
    return item;
  });
};

const updateSecuritySupport = () => {
  if (elements.securityStatusBadge) {
    const badge = elements.securityStatusBadge;
    badge.classList.remove(
      'bg-emerald-100',
      'text-emerald-700',
      'dark:bg-emerald-500/20',
      'dark:text-emerald-200',
      'bg-amber-100',
      'text-amber-700',
      'dark:bg-amber-500/20',
      'dark:text-amber-200',
    );
    if (securityState.supported) {
      badge.classList.add('bg-emerald-100', 'text-emerald-700', 'dark:bg-emerald-500/20', 'dark:text-emerald-200');
      badge.textContent = 'Aktif';
    } else {
      badge.classList.add('bg-amber-100', 'text-amber-700', 'dark:bg-amber-500/20', 'dark:text-amber-200');
      badge.textContent = 'Mode kompatibilitas';
    }
  }
  if (elements.securitySupportMessage) {
    elements.securitySupportMessage.textContent = securityState.supported
      ? 'Penyimpanan terenkripsi aktif dengan AES-256 dan fingerprint SHA-256.'
      : 'Web Crypto penuh tidak tersedia, sistem menggunakan sandi kompatibel untuk menjaga data.';
  }
};

const toneClassMap = {
  success: ['text-emerald-600', 'dark:text-emerald-300'],
  error: ['text-red-600', 'dark:text-red-400'],
  info: ['text-blue-600', 'dark:text-blue-300'],
};

const updateIntegrityStatus = (message, tone = 'info') => {
  if (!elements.integrityStatus) return;
  const element = elements.integrityStatus;
  element.textContent = message;
  Object.values(toneClassMap).forEach((classes) => element.classList.remove(...classes));
  const classes = toneClassMap[tone] || toneClassMap.info;
  element.classList.add(...classes);
};

const updateSecuritySummary = async () => {
  if (!preferencesStore) return;
  try {
    const fingerprint = await generateIntegrityHash(preferencesStore.getState());
    securityState.fingerprint = fingerprint;
    securityState.lastPreferencesUpdate = new Date();
    if (elements.securityFingerprint) {
      elements.securityFingerprint.textContent = maskFingerprint(fingerprint);
    }
    if (elements.securityUpdatedAt) {
      elements.securityUpdatedAt.textContent = formatTimestamp(securityState.lastPreferencesUpdate);
    }
  } catch (error) {
    console.warn('Gagal memperbarui fingerprint preferensi', error);
    if (elements.securityFingerprint) {
      elements.securityFingerprint.textContent = 'Fingerprint tidak tersedia';
    }
  }
  updateSecuritySupport();
};

const updateContentIntegrity = async (articles = uiState.articles) => {
  if (!elements.integrityStatus) return;
  if (!articles?.length) {
    securityState.lastIntegrityHash = '';
    securityState.lastIntegrityCheck = new Date();
    updateIntegrityStatus('Menunggu data berita untuk dianalisis.', 'info');
    return;
  }
  try {
    const digest = await generateIntegrityHash(
      articles
        .map((article) => `${article.title || ''}|${article.publishedAt || ''}|${article.url || ''}`)
        .join('||'),
    );
    securityState.lastIntegrityHash = digest;
    securityState.lastIntegrityCheck = new Date();
    updateIntegrityStatus(
      `Fingerprint konten ${maskFingerprint(digest)} diperbarui ${formatTimestamp(securityState.lastIntegrityCheck)}.`,
      'success',
    );
  } catch (error) {
    console.warn('Gagal menghitung fingerprint konten', error);
    updateIntegrityStatus('Fingerprint konten tidak dapat dihitung.', 'error');
  }
};

const initSecurityPanel = () => {
  renderSecurityHighlights(elements.securityHighlights);
  updateSecuritySupport();
  updateIntegrityStatus('Menunggu data berita untuk dianalisis.', 'info');
  elements.integrityCheckButton?.addEventListener('click', async () => {
    await updateContentIntegrity();
    updateStatusBanner(elements.statusBanner, {
      online: true,
      tone: 'success',
      message: 'Fingerprint konten diperbarui.',
    });
    setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1600);
  });
  elements.copyFingerprintButton?.addEventListener('click', async () => {
    if (!securityState.fingerprint) {
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'error',
        message: 'Fingerprint preferensi belum tersedia.',
      });
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(securityState.fingerprint);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = securityState.fingerprint;
        textarea.setAttribute('readonly', 'true');
        textarea.style.position = 'absolute';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'success',
        message: 'Fingerprint preferensi disalin ke clipboard.',
      });
      setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1400);
    } catch (error) {
      console.warn('Gagal menyalin fingerprint', error);
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'error',
        message: 'Tidak dapat menyalin fingerprint. Coba secara manual.',
      });
    }
  });
};

const updateCommandPaletteActive = () => {
  if (!elements.commandPaletteList) return;
  qsa('[data-command-index]', elements.commandPaletteList).forEach((item) => {
    const index = Number(item.dataset.commandIndex);
    const isActive = index === commandPaletteState.activeIndex;
    toggleClass(item, 'bg-blue-50', isActive);
    toggleClass(item, 'dark:bg-blue-500/20', isActive);
    toggleClass(item, 'border-blue-500/60', isActive);
    item.setAttribute('aria-selected', String(isActive));
    if (isActive) {
      item.scrollIntoView({ block: 'nearest' });
    }
  });
};

const renderCommandPaletteItems = () => {
  if (!elements.commandPaletteList) return;
  elements.commandPaletteList.innerHTML = '';
  if (!commandPaletteState.filtered.length) {
    const empty = document.createElement('li');
    empty.className = 'px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400';
    empty.textContent = 'Perintah tidak ditemukan. Coba kata kunci lain.';
    empty.setAttribute('aria-disabled', 'true');
    elements.commandPaletteList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  commandPaletteState.filtered.forEach((action, index) => {
    const item = document.createElement('li');
    item.className = `flex items-center justify-between gap-4 rounded-xl border border-transparent px-4 py-3 transition ${
      action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800'
    }`;
    item.dataset.commandIndex = String(index);
    item.dataset.commandId = action.id;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', 'false');
    if (action.disabled) {
      item.setAttribute('aria-disabled', 'true');
    }
    item.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
          <i class="${action.icon}"></i>
        </span>
        <div class="flex flex-col">
          <span class="text-sm font-semibold">${action.title}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">${action.description}</span>
        </div>
      </div>
      ${
        action.shortcut
          ? `<span class="text-xs font-medium text-gray-400 dark:text-gray-500">${action.shortcut}</span>`
          : ''
      }
    `;
    if (!action.disabled) {
      item.addEventListener('click', () => executeCommand(action.id));
    }
    item.addEventListener('mouseenter', () => {
      if (action.disabled) return;
      commandPaletteState.activeIndex = index;
      updateCommandPaletteActive();
    });
    fragment.appendChild(item);
  });
  elements.commandPaletteList.appendChild(fragment);
  updateCommandPaletteActive();
};

const filterCommandPaletteItems = (query) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    commandPaletteState.filtered = commandPaletteState.items.slice();
    const firstEnabled = commandPaletteState.filtered.findIndex((item) => !item.disabled);
    commandPaletteState.activeIndex = firstEnabled >= 0 ? firstEnabled : 0;
    renderCommandPaletteItems();
    return;
  }
  commandPaletteState.filtered = commandPaletteState.items.filter((action) => {
    const haystack = `${action.title} ${action.description} ${action.keywords || ''}`.toLowerCase();
    return haystack.includes(normalized);
  });
  const firstEnabled = commandPaletteState.filtered.findIndex((item) => !item.disabled);
  commandPaletteState.activeIndex = firstEnabled >= 0 ? firstEnabled : 0;
  renderCommandPaletteItems();
};

const closeCommandPalette = () => {
  if (!commandPaletteState.isOpen) return;
  setHidden(elements.commandPalette, true);
  elements.commandPalette?.setAttribute('aria-hidden', 'true');
  elements.commandPaletteButton?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('overflow-hidden');
  commandPaletteState.isOpen = false;
  commandPaletteState.activeIndex = 0;
  if (elements.commandPaletteSearch) {
    elements.commandPaletteSearch.value = '';
  }
  if (commandPaletteState.returnFocusTo?.focus) {
    commandPaletteState.returnFocusTo.focus();
  }
  commandPaletteState.returnFocusTo = null;
};

const openCommandPalette = () => {
  commandPaletteState.items = computeCommandItems();
  commandPaletteState.filtered = commandPaletteState.items.slice();
  const firstEnabled = commandPaletteState.filtered.findIndex((item) => !item.disabled);
  commandPaletteState.activeIndex = firstEnabled >= 0 ? firstEnabled : 0;
  commandPaletteState.returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  setHidden(elements.commandPalette, false);
  elements.commandPalette?.setAttribute('aria-hidden', 'false');
  elements.commandPaletteButton?.setAttribute('aria-expanded', 'true');
  document.body.classList.add('overflow-hidden');
  commandPaletteState.isOpen = true;
  renderCommandPaletteItems();
  if (elements.commandPaletteSearch) {
    elements.commandPaletteSearch.value = '';
    setTimeout(() => elements.commandPaletteSearch?.focus(), 60);
  }
};

const moveCommandSelection = (direction) => {
  if (!commandPaletteState.filtered.length) return;
  const total = commandPaletteState.filtered.length;
  let nextIndex = (commandPaletteState.activeIndex + direction + total) % total;
  let safety = 0;
  while (commandPaletteState.filtered[nextIndex]?.disabled && safety < total) {
    nextIndex = (nextIndex + direction + total) % total;
    safety += 1;
  }
  commandPaletteState.activeIndex = nextIndex;
  updateCommandPaletteActive();
};

const executeCommand = async (commandId) => {
  const action =
    commandPaletteState.filtered.find((item) => item.id === commandId) ||
    commandPaletteState.items.find((item) => item.id === commandId) ||
    COMMAND_ACTIONS.find((item) => item.id === commandId);
  if (!action || action.disabled) return;
  closeCommandPalette();

  switch (commandId) {
    case 'focus-search':
      elements.searchInput?.focus();
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'success',
        message: 'Kolom pencarian siap digunakan.',
      });
      setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1200);
      break;
    case 'toggle-theme': {
      const resolved = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const nextTheme = resolved === 'dark' ? 'light' : 'dark';
      preferencesStore.setTheme(nextTheme);
      applyTheme(nextTheme);
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'success',
        message: nextTheme === 'dark' ? 'Mode gelap diaktifkan.' : 'Mode terang diaktifkan.',
      });
      setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1500);
      break;
    }
    case 'toggle-density': {
      const current = preferencesStore.getState().density;
      const nextDensity = current === 'compact' ? 'comfortable' : 'compact';
      preferencesStore.setDensity(nextDensity);
      updateDensityToggle(elements.densityToggle, nextDensity);
      applyArticles(uiState.articles);
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'success',
        message: nextDensity === 'compact' ? 'Mode padat aktif.' : 'Mode ruang lega aktif.',
      });
      setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1500);
      break;
    }
    case 'run-integrity-check': {
      await updateContentIntegrity();
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'success',
        message: 'Fingerprint konten diperbarui.',
      });
      setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1800);
      break;
    }
    case 'view-grid':
      preferencesStore.setViewMode('grid');
      updateViewToggle(elements.viewToggle, 'grid');
      applyArticles(uiState.articles);
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'success',
        message: 'Tampilan grid diaktifkan.',
      });
      setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1200);
      break;
    case 'view-list':
      preferencesStore.setViewMode('list');
      updateViewToggle(elements.viewToggle, 'list');
      applyArticles(uiState.articles);
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'success',
        message: 'Tampilan daftar diaktifkan.',
      });
      setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1200);
      break;
    case 'open-trending':
      document.getElementById('trending')?.scrollIntoView({ behavior: preferReducedMotion() ? 'auto' : 'smooth' });
      break;
    case 'open-saved-filters':
      document.getElementById('savedFiltersList')?.scrollIntoView({ behavior: preferReducedMotion() ? 'auto' : 'smooth' });
      break;
    case 'refresh-articles':
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: 'info',
        message: 'Menyegarkan berita terbaru...',
      });
      await fetchAndRender({ page: uiState.page });
      updateStatusBanner(elements.statusBanner, {
        online: true,
        tone: navigator.onLine ? 'success' : 'error',
        message: navigator.onLine ? 'Berita diperbarui.' : 'Menampilkan data terakhir dari cache.',
      });
      setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1400);
      break;
    default:
      break;
  }
};

const isEditableElement = (element) => {
  if (!element) return false;
  if (element.isContentEditable) return true;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
};

const initCommandPalette = () => {
  elements.commandPaletteButton?.addEventListener('click', () => {
    if (commandPaletteState.isOpen) {
      closeCommandPalette();
    } else {
      openCommandPalette();
    }
  });
  elements.commandPaletteOverlay?.addEventListener('click', closeCommandPalette);
  elements.commandPaletteClose?.addEventListener('click', closeCommandPalette);
  elements.commandPaletteSearch?.addEventListener('input', (event) => {
    filterCommandPaletteItems(event.target.value);
  });
  elements.commandPaletteSearch?.addEventListener('keydown', (event) => {
    if (!commandPaletteState.isOpen) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveCommandSelection(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveCommandSelection(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const current = commandPaletteState.filtered[commandPaletteState.activeIndex];
      if (current && !current.disabled) {
        executeCommand(current.id);
      }
    }
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === 'k') {
      event.preventDefault();
      if (commandPaletteState.isOpen) {
        closeCommandPalette();
      } else {
        openCommandPalette();
      }
      return;
    }
    if (!commandPaletteState.isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCommandPalette();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveCommandSelection(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveCommandSelection(-1);
      return;
    }
    if (event.key === 'Enter' && document.activeElement !== elements.commandPaletteSearch) {
      event.preventDefault();
      const current = commandPaletteState.filtered[commandPaletteState.activeIndex];
      if (current && !current.disabled) {
        executeCommand(current.id);
      }
    }
  });
};

const initKeyboardShortcuts = () => {
  window.addEventListener('keydown', (event) => {
    if (commandPaletteState.isOpen) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const active = document.activeElement;
    const editing = isEditableElement(active);
    if (event.key === '/' && !editing) {
      event.preventDefault();
      elements.searchInput?.focus();
      return;
    }
    if ((event.key === 't' || event.key === 'T') && !editing) {
      event.preventDefault();
      executeCommand('toggle-theme');
      return;
    }
    if ((event.key === 'r' || event.key === 'R') && !editing) {
      event.preventDefault();
      executeCommand('refresh-articles');
    }
  });
};

const initRefreshControl = () => {
  elements.refreshArticles?.addEventListener('click', async () => {
    updateStatusBanner(elements.statusBanner, {
      online: true,
      tone: 'info',
      message: 'Menyegarkan berita terbaru...',
    });
    await fetchAndRender({ page: uiState.page });
    updateStatusBanner(elements.statusBanner, {
      online: true,
      tone: navigator.onLine ? 'success' : 'error',
      message: navigator.onLine ? 'Berita diperbarui.' : 'Menampilkan data terakhir dari cache.',
    });
    setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1400);
  });
};

const initScrollProgress = () => {
  const updateProgress = () => {
    if (elements.scrollProgress) {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const percent = max > 0 ? (window.scrollY / max) * 100 : 0;
      elements.scrollProgress.style.width = `${percent}%`;
    }
    if (elements.backToTop) {
      const show = window.scrollY > 320;
      toggleClass(elements.backToTop, 'opacity-0', !show);
      toggleClass(elements.backToTop, 'pointer-events-none', !show);
    }
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  elements.backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: preferReducedMotion() ? 'auto' : 'smooth' });
  });
};

const initPreferenceSync = () => {
  preferencesStore.subscribe((state) => {
    updateViewToggle(elements.viewToggle, state.viewMode);
    updateDensityToggle(elements.densityToggle, state.density);
    updateSecuritySummary();
  });
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
  const { viewMode, density } = preferencesStore.getState();
  renderArticles({ container: elements.newsGrid, articles: [], viewMode, density });
  updateContentIntegrity([]);
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
  const { viewMode, pageSize, density } = preferencesStore.getState();
  renderSkeletons({
    container: elements.newsGrid,
    viewMode,
    count: pageSize,
    density,
  });
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
  updateDensityToggle(elements.densityToggle, preferences.density);
};

const applyArticles = (articles) => {
  const { viewMode, density } = preferencesStore.getState();
  renderArticles({ container: elements.newsGrid, articles, viewMode, density });
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
    await updateContentIntegrity(articles);
    updatePagination();
  } catch (error) {
    console.error('Gagal memuat berita', error);
    hideLoading();
    if (!navigator.onLine) {
      const fallback = await newsClient.getOfflineFallback();
      if (fallback?.payload?.articles?.length) {
        uiState.totalResults = fallback.payload.totalArticles ?? fallback.payload.articles.length;
        uiState.articles = fallback.payload.articles;
        uiState.lastUpdated = fallback.persistedAt ? new Date(fallback.persistedAt) : null;
        renderFeaturedArticle(elements.featuredArticle, uiState.articles[0]);
        applyArticles(uiState.articles);
        await updateContentIntegrity(uiState.articles);
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

const initReadingDensityToggle = () => {
  updateDensityToggle(elements.densityToggle, preferencesStore.getState().density);
  elements.densityToggle?.addEventListener('click', () => {
    const current = preferencesStore.getState().density;
    const nextDensity = current === 'compact' ? 'comfortable' : 'compact';
    preferencesStore.setDensity(nextDensity);
    updateDensityToggle(elements.densityToggle, nextDensity);
    applyArticles(uiState.articles);
    updateStatusBanner(elements.statusBanner, {
      online: true,
      tone: 'success',
      message: nextDensity === 'compact' ? 'Mode padat aktif.' : 'Mode ruang lega aktif.',
    });
    setTimeout(() => updateStatusBanner(elements.statusBanner, { online: null, message: '', tone: 'info' }), 1500);
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
  qs('[data-open-command-palette]', elements.mobileMenu)?.addEventListener('click', () => {
    elements.mobileMenuButton?.setAttribute('aria-expanded', 'false');
    toggleClass(elements.mobileMenu, 'hidden', true);
    openCommandPalette();
  });
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

const initApp = async () => {
  preferencesStore = await createPreferencesStore();
  savedFiltersStore = await createSavedFiltersStore();
  initSecurityPanel();
  await updateSecuritySummary();
  fillSelectOptions();
  hydrateFormFromPreferences();
  initFormHandlers();
  initQuickFilters();
  initCategoryPills();
  initPagination();
  initViewToggle();
  initReadingDensityToggle();
  initSavedFilters();
  initThemeToggle();
  initMobileMenu();
  initTrending();
  initRefreshControl();
  initCommandPalette();
  initKeyboardShortcuts();
  initScrollProgress();
  initNetworkListeners();
  initAccessibility();
  initPreferenceSync();
  syncOfflineBadge();
  await updateContentIntegrity([]);
  await fetchAndRender({ page: 1 });
};

window.addEventListener('DOMContentLoaded', () => {
  initApp().catch((error) => {
    console.error('Gagal menginisialisasi aplikasi', error);
    updateStatusBanner(elements.statusBanner, {
      online: true,
      tone: 'error',
      message: 'Gagal memulai aplikasi. Muat ulang untuk mencoba lagi.',
    });
  });
});
