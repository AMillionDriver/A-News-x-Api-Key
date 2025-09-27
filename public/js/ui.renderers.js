import { NICHE_FOCUS_AREAS, SECURITY_MEASURES, TRENDING_IDEAS } from '../constants.js';
import { animateSwap, createFragmentFromHTML, qsa, sanitizeUrl, setHidden, toggleClass, truncateText } from '../utils.dom.js';
import { buildMetaText, formatDateTime, pluralize } from '../utils.formatters.js';

const defaultImage = 'https://placehold.co/800x600/png?text=Gambar+Berita+Tidak+Tersedia';

export const renderSkeletons = ({ container, viewMode = 'grid', count = 9, density = 'comfortable' }) => {
  if (!container) return;
  const gapClass =
    viewMode === 'list'
      ? density === 'compact'
        ? 'space-y-4'
        : 'space-y-6'
      : density === 'compact'
      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
      : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6';
  container.className = gapClass;
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index += 1) {
    const card = createFragmentFromHTML(`
      <article class="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse bg-white/60 dark:bg-gray-900/60">
        <div class="h-44 bg-gray-200 dark:bg-gray-800"></div>
        <div class="${density === 'compact' ? 'p-5 space-y-3' : 'p-6 space-y-4'}">
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
          </div>
        </div>
      </article>
    `);
    fragment.appendChild(card);
  }
  container.innerHTML = '';
  container.appendChild(fragment);
};

export const renderArticles = ({ container, articles, viewMode, density = 'comfortable' }) => {
  if (!container) return;
  const layoutClass =
    viewMode === 'list'
      ? density === 'compact'
        ? 'space-y-4'
        : 'space-y-6'
      : density === 'compact'
      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
      : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6';
  container.className = layoutClass;
  if (!articles?.length) {
    container.innerHTML = '';
    return;
  }

  const fragment = document.createDocumentFragment();
  articles.forEach((article) => {
    const meta = buildMetaText(article);
    const card = createFragmentFromHTML(`
      <article class="relative group rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm hover:shadow-lg transition" data-density="${density}">
        <div class="relative h-48 overflow-hidden">
          <img src="${article.image || defaultImage}" alt="${article.title ? article.title.replace(/"/g, '') : 'Gambar artikel'}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy"/>
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
            <span class="inline-flex items-center gap-2 bg-black/40 backdrop-blur px-3 py-1 rounded-full">
              <i class="fas fa-newspaper"></i>
              ${article.source?.name || 'Sumber tidak diketahui'}
            </span>
            <time datetime="${article.publishedAt}">${meta}</time>
          </div>
        </div>
        <div class="${density === 'compact' ? 'p-5 space-y-3' : 'p-6 space-y-4'}">
          <div class="space-y-2">
            <h3 class="text-lg font-semibold leading-tight">
              <a href="${sanitizeUrl(article.url)}" target="_blank" rel="noopener" class="hover:text-blue-600 dark:hover:text-blue-400 transition">
                ${article.title || 'Tanpa judul'}
              </a>
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">${truncateText(article.description || 'Tidak ada ringkasan tersedia.')}</p>
          </div>
          <div class="flex flex-wrap items-center ${density === 'compact' ? 'gap-2' : 'gap-3'} text-xs text-gray-500 dark:text-gray-400">
            <span class="inline-flex items-center gap-1"><i class="fas fa-clock"></i>${meta}</span>
            <button class="share-button inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition" data-url="${sanitizeUrl(article.url)}" data-title="${article.title || ''}">
              <i class="fas fa-share-alt"></i> Bagikan
            </button>
            <a href="${sanitizeUrl(article.url)}" target="_blank" rel="noopener" class="ml-auto inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
              Baca selengkapnya <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </article>
    `);
    fragment.appendChild(card);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
  animateSwap(container);
};

export const renderFeaturedArticle = (container, article) => {
  if (!container) return;
  if (!article) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = '';
  const card = createFragmentFromHTML(`
    <div class="grid md:grid-cols-2">
      <div class="relative h-72 md:h-full overflow-hidden rounded-l-2xl">
        <img src="${article.image || defaultImage}" alt="${article.title ? article.title.replace(/"/g, '') : 'Gambar sorotan'}" class="w-full h-full object-cover" loading="lazy" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-4 text-white space-y-2">
          <span class="inline-flex items-center gap-2 text-xs uppercase tracking-wider">
            <i class="fas fa-star text-yellow-400"></i> Sorotan pilihan
          </span>
          <time datetime="${article.publishedAt}" class="text-sm text-white/80">${buildMetaText(article)}</time>
        </div>
      </div>
      <div class="p-8 space-y-5">
        <h3 class="text-2xl font-bold leading-tight">${article.title || 'Sorotan utama NewsApp'}</h3>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">${truncateText(
          article.description || 'Analisis mendalam dan rangkuman isu utama hari ini.',
          320,
        )}</p>
        <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span class="inline-flex items-center gap-2"><i class="fas fa-building"></i>${article.source?.name || 'Sumber tidak diketahui'}</span>
          <span class="inline-flex items-center gap-2"><i class="fas fa-clock"></i>${buildMetaText(article)}</span>
        </div>
        <div class="flex flex-wrap gap-3">
          <a href="${sanitizeUrl(article.url)}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg transition">
            Baca sorotan <i class="fas fa-arrow-right"></i>
          </a>
          <button class="share-button inline-flex items-center gap-2 border border-gray-200 dark:border-gray-700 px-5 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition" data-url="${sanitizeUrl(article.url)}" data-title="${article.title || ''}">
            <i class="fas fa-share-alt"></i> Bagikan
          </button>
        </div>
      </div>
    </div>
  `);

  container.appendChild(card);
  animateSwap(container);
};

export const renderStats = ({
  totalArticlesStat,
  activeFiltersStat,
  lastUpdatedStat,
  total,
  activeFilters,
  lastUpdated,
}) => {
  if (totalArticlesStat) totalArticlesStat.textContent = `${total.toLocaleString('id-ID')} ${pluralize(total, 'artikel', 'artikel')}`;
  if (activeFiltersStat) activeFiltersStat.textContent = activeFilters;
  if (lastUpdatedStat) lastUpdatedStat.textContent = lastUpdated ? formatDateTime(lastUpdated) : '-';
};

export const renderTrendingTopics = (container, onSelect) => {
  if (!container) return;
  const ideas = TRENDING_IDEAS.slice().sort(() => Math.random() - 0.5).slice(0, 6);
  const fragment = document.createDocumentFragment();
  ideas.forEach((idea) => {
    const element = createFragmentFromHTML(`
      <button type="button" class="flex flex-col items-start gap-2 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-500 hover:shadow-md transition text-left" data-query="${idea.query}">
        <span class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400"><i class="${idea.icon}"></i>${idea.title}</span>
        <span class="text-sm text-gray-600 dark:text-gray-300">${idea.description}</span>
      </button>
    `);
    const button = element.querySelector('button');
    button?.addEventListener('click', () => onSelect?.(idea));
    fragment.appendChild(element);
  });
  container.innerHTML = '';
  container.appendChild(fragment);
};

export const renderNicheFocus = (container, onSelect) => {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  NICHE_FOCUS_AREAS.forEach((area) => {
    const element = createFragmentFromHTML(`
      <article class="flex flex-col gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6">
        <div class="flex items-center gap-3 text-blue-600 dark:text-blue-400">
          <i class="${area.icon} text-xl"></i>
          <h4 class="text-lg font-semibold">${area.title}</h4>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">${area.description}</p>
        <button type="button" class="mt-auto inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none" data-query="${area.query}">
          Telusuri topik <i class="fas fa-arrow-right"></i>
        </button>
      </article>
    `);
    const button = element.querySelector('button');
    button?.addEventListener('click', () => onSelect?.(area));
    fragment.appendChild(element);
  });
  container.innerHTML = '';
  container.appendChild(fragment);
};

export const renderSecurityHighlights = (container) => {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  SECURITY_MEASURES.forEach((item) => {
    const element = createFragmentFromHTML(`
      <article class="flex items-start gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/60 p-4 shadow-sm">
        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300">
          <i class="${item.icon}"></i>
        </span>
        <div class="space-y-1">
          <h4 class="text-sm font-semibold">${item.title}</h4>
          <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">${item.description}</p>
        </div>
      </article>
    `);
    fragment.appendChild(element);
  });
  container.innerHTML = '';
  container.appendChild(fragment);
};

export const renderSavedFilters = (container, filters, { onSelect, onDelete }) => {
  if (!container) return;
  container.innerHTML = '';
  if (!filters?.length) {
    container.innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">Belum ada filter tersimpan.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  filters.forEach((filter) => {
    const element = createFragmentFromHTML(`
      <li class="flex items-center gap-3 justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div class="flex flex-col">
          <span class="font-medium">${filter.name}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">${filter.query || 'Semua berita'} • ${filter.category || 'Semua kategori'} • ${filter.sortBy}</span>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline focus:outline-none" data-action="apply">Gunakan</button>
          <button type="button" class="inline-flex items-center gap-2 text-sm text-red-500 hover:underline focus:outline-none" data-action="delete"><i class="fas fa-trash"></i></button>
        </div>
      </li>
    `);
    fragment.appendChild(element);
  });

  qsa('li', fragment).forEach((item, index) => {
    const filter = filters[index];
    item.querySelector('[data-action="apply"]').addEventListener('click', () => onSelect?.(filter));
    item.querySelector('[data-action="delete"]').addEventListener('click', () => onDelete?.(filter));
  });

  container.appendChild(fragment);
};

export const updateViewToggle = (viewToggle, viewMode) => {
  if (!viewToggle) return;
  qsa('button[data-view]', viewToggle).forEach((button) => {
    const isActive = button.dataset.view === viewMode;
    toggleClass(button, 'bg-blue-600', isActive);
    toggleClass(button, 'text-white', isActive);
    toggleClass(button, 'bg-gray-100', !isActive);
    toggleClass(button, 'dark:bg-gray-800', !isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
};

export const updateStatusBanner = (banner, { online, message, tone }) => {
  if (!banner) return;
  banner.textContent = message;
  banner.className = `fixed top-20 inset-x-0 mx-auto max-w-md rounded-full px-4 py-2 text-sm font-medium shadow-lg transition ${
    tone === 'error'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/70 dark:text-red-100'
      : tone === 'success'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/70 dark:text-green-100'
      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-100'
  }`;
  setHidden(banner, online === null);
};

export const updateDensityToggle = (toggle, density) => {
  if (!toggle) return;
  const icon = toggle.querySelector('i');
  const label = toggle.querySelector('.density-label');
  const isCompact = density === 'compact';
  if (icon) icon.className = isCompact ? 'fas fa-grip-lines' : 'fas fa-layer-group';
  if (label) label.textContent = isCompact ? 'Mode padat' : 'Ruang lega';
  const nextAction = isCompact ? 'Longgarkan jarak antar kartu' : 'Rapatkan jarak antar kartu';
  toggle.dataset.density = density;
  toggle.setAttribute('aria-pressed', String(isCompact));
  toggle.setAttribute('aria-label', nextAction);
  toggle.setAttribute('title', nextAction);
};
