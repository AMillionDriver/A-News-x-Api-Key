(() => {
  const PAGE_SIZE = 9;

  const newsGrid = document.getElementById('newsGrid');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');
  const noResultsMessage = document.getElementById('noResultsMessage');
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categorySelect');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const mobileMenuButton = document.getElementById('mobileMenuButton');
  const mobileMenu = document.getElementById('mobileMenu');

  let currentPage = 1;
  let totalResults = 0;
  let currentQuery = '';
  let currentCategory = '';

  const defaultImage = 'https://placehold.co/600x400/png?text=Gambar+Berita+Tidak+Tersedia';

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const months = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const setHidden = (element, hidden) => {
    if (!element) return;
    element.hidden = hidden;
    if (hidden) {
      element.classList.add('hidden');
    } else {
      element.classList.remove('hidden');
    }
  };

  const resetMessages = () => {
    setHidden(errorMessage, true);
    setHidden(noResultsMessage, true);
  };

  const showError = (message) => {
    if (!errorMessage) return;
    errorMessage.textContent = message;
    setHidden(errorMessage, false);
    setHidden(noResultsMessage, true);
  };

  const showNoResults = () => {
    setHidden(noResultsMessage, false);
    setHidden(errorMessage, true);
  };

  const showLoading = () => {
    setHidden(loadingIndicator, false);
    resetMessages();
    if (newsGrid) {
      newsGrid.innerHTML = '';
    }
  };

  const hideLoading = () => {
    setHidden(loadingIndicator, true);
  };

  const renderNews = (articles) => {
    if (!newsGrid) return;
    newsGrid.innerHTML = '';

    if (!articles || articles.length === 0) {
      showNoResults();
      return;
    }

    const fragment = document.createDocumentFragment();

    articles.forEach((article) => {
      const { image, title, publishedAt, description, url, source } = article;
      const card = document.createElement('article');
      card.setAttribute('tabindex', '0');
      card.className =
        'flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500';

      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'w-full aspect-[3/2] overflow-hidden bg-gray-200 dark:bg-gray-700';

      const img = document.createElement('img');
      img.src = image || defaultImage;
      img.alt = title || 'Gambar berita';
      img.loading = 'lazy';
      img.className = 'object-cover w-full h-full';
      imgWrapper.appendChild(img);

      const content = document.createElement('div');
      content.className = 'flex flex-col flex-grow p-4';

      const heading = document.createElement('h2');
      heading.className = 'text-lg font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-gray-100';
      heading.textContent = title || 'Judul berita tidak tersedia';

      const meta = document.createElement('p');
      meta.className = 'text-sm text-gray-500 dark:text-gray-400 mb-3 select-none';
      meta.textContent = formatDate(publishedAt);
      if (source && source.name) {
        meta.textContent += ` • ${source.name}`;
      }

      const descriptionEl = document.createElement('p');
      descriptionEl.className = 'text-gray-700 dark:text-gray-300 flex-grow line-clamp-3 mb-4';
      descriptionEl.textContent = description || 'Deskripsi berita tidak tersedia.';

      const link = document.createElement('a');
      link.href = url || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className =
        'inline-block mt-auto self-start bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-md px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500';
      link.textContent = 'Baca Selengkapnya';

      content.appendChild(heading);
      content.appendChild(meta);
      content.appendChild(descriptionEl);
      content.appendChild(link);

      card.appendChild(imgWrapper);
      card.appendChild(content);
      fragment.appendChild(card);
    });

    newsGrid.appendChild(fragment);
  };

  const updatePagination = () => {
    const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
    pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    const canGoPrev = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    prevPageBtn.disabled = !canGoPrev;
    nextPageBtn.disabled = !canGoNext;

    prevPageBtn.setAttribute('aria-disabled', String(!canGoPrev));
    nextPageBtn.setAttribute('aria-disabled', String(!canGoNext));
  };

  const fetchNews = async () => {
    showLoading();

    const params = new URLSearchParams({
      query: currentQuery,
      category: currentCategory,
      page: String(currentPage),
      pageSize: String(PAGE_SIZE),
    });

    try {
      const response = await fetch(`/api/news?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody.message || `Gagal mengambil data: ${response.status}`;
        throw new Error(message);
      }

      const data = await response.json();
      totalResults = data.totalArticles || 0;
      renderNews(data.articles);
      updatePagination();
    } catch (error) {
      console.error(error); // eslint-disable-line no-console
      showError(error.message || 'Terjadi kesalahan saat mengambil berita.');
      pageInfo.textContent = '';
    } finally {
      hideLoading();
    }
  };

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    currentQuery = searchInput.value.trim();
    currentPage = 1;
    fetchNews();
  });

  categorySelect.addEventListener('change', () => {
    currentCategory = categorySelect.value;
    currentPage = 1;
    fetchNews();
  });

  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      fetchNews();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(totalResults / PAGE_SIZE);
    if (currentPage < totalPages) {
      currentPage += 1;
      fetchNews();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  const setDarkMode = (enabled) => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
      darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      darkModeToggle.setAttribute('aria-label', 'Matikan mode gelap');
      darkModeToggle.title = 'Matikan mode gelap';
    } else {
      root.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
      darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      darkModeToggle.setAttribute('aria-label', 'Nyalakan mode gelap');
      darkModeToggle.title = 'Nyalakan mode gelap';
    }
  };

  darkModeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(!isDark);
  });

  (() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setDarkMode(true);
    } else if (saved === 'false') {
      setDarkMode(false);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  })();

  mobileMenuButton.addEventListener('click', () => {
    if (mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.remove('hidden');
      mobileMenuButton.setAttribute('aria-expanded', 'true');
    } else {
      mobileMenu.classList.add('hidden');
      mobileMenuButton.setAttribute('aria-expanded', 'false');
    }
  });

  fetchNews();
})();
