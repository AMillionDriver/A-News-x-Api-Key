export const API_BASE_URL = '/api/news';

export const DEFAULT_PAGE_SIZE = 9;

export const PAGE_SIZE_OPTIONS = [9, 12, 18, 24];

export const SORT_OPTIONS = [
  { value: 'publishedAt', label: 'Terbaru' },
  { value: 'relevance', label: 'Relevansi' },
  { value: 'popularity', label: 'Populer' },
];

export const TIME_RANGE_OPTIONS = [
  { value: 'all', label: 'Semua waktu' },
  { value: '24h', label: '24 jam terakhir' },
  { value: '48h', label: '48 jam terakhir' },
  { value: '7d', label: '7 hari terakhir' },
  { value: '30d', label: '30 hari terakhir' },
];

export const CATEGORY_OPTIONS = [
  { value: '', label: 'Semua kategori' },
  { value: 'business', label: 'Bisnis' },
  { value: 'technology', label: 'Teknologi' },
  { value: 'sports', label: 'Olahraga' },
  { value: 'health', label: 'Kesehatan' },
  { value: 'entertainment', label: 'Hiburan' },
  { value: 'science', label: 'Sains' },
];

export const STORAGE_KEYS = {
  preferences: 'newsapp.preferences.v3',
  cachedArticles: 'newsapp.cachedArticles.v1',
  savedFilters: 'newsapp.savedFilters.v1',
};

export const READING_DENSITY_OPTIONS = [
  {
    value: 'comfortable',
    label: 'Ruang lega',
    description: 'Spasi longgar untuk pengalaman membaca santai.',
  },
  {
    value: 'compact',
    label: 'Mode padat',
    description: 'Tampilkan lebih banyak artikel dalam satu layar dengan jarak rapat.',
  },
];

export const COMMAND_ACTIONS = [
  {
    id: 'focus-search',
    title: 'Fokus ke pencarian',
    description: 'Sorot kolom pencarian utama untuk mulai mengetik.',
    icon: 'fas fa-search',
    keywords: 'search cari fokus',
    shortcut: '/',
  },
  {
    id: 'toggle-theme',
    title: 'Aktifkan mode gelap',
    description: 'Beralih antara tema terang dan gelap.',
    icon: 'fas fa-adjust',
    keywords: 'tema theme dark gelap terang',
    shortcut: 'T',
  },
  {
    id: 'toggle-density',
    title: 'Ganti kepadatan tampilan',
    description: 'Sesuaikan jarak antar kartu berita.',
    icon: 'fas fa-grip-horizontal',
    keywords: 'density padat compact rapat nyaman',
  },
  {
    id: 'view-grid',
    title: 'Gunakan tampilan grid',
    description: 'Susun artikel dalam kisi 3 kolom responsif.',
    icon: 'fas fa-th-large',
    keywords: 'grid kartu layout',
  },
  {
    id: 'view-list',
    title: 'Gunakan tampilan daftar',
    description: 'Baca artikel secara vertikal seperti daftar.',
    icon: 'fas fa-list',
    keywords: 'list daftar baris',
  },
  {
    id: 'open-trending',
    title: 'Buka bagian trending',
    description: 'Loncat ke ide topik populer hari ini.',
    icon: 'fas fa-fire-alt',
    keywords: 'trending populer ide',
  },
  {
    id: 'open-saved-filters',
    title: 'Buka filter tersimpan',
    description: 'Kelola preset pencarian yang pernah disimpan.',
    icon: 'fas fa-bookmark',
    keywords: 'filter tersimpan favorit',
  },
  {
    id: 'refresh-articles',
    title: 'Segarkan daftar berita',
    description: 'Ambil artikel terbaru dari API.',
    icon: 'fas fa-sync',
    keywords: 'refresh segarkan update',
    shortcut: 'R',
  },
];

export const TRENDING_IDEAS = [
  {
    title: 'Teknologi AI',
    query: 'kecerdasan buatan',
    icon: 'fas fa-robot',
    description: 'Inovasi terbaru dalam kecerdasan buatan dan otomatisasi.',
  },
  {
    title: 'Ekonomi Hijau',
    query: 'ekonomi hijau',
    icon: 'fas fa-leaf',
    description: 'Transisi energi dan kebijakan ramah lingkungan global.',
  },
  {
    title: 'Pasar Kripto',
    query: 'mata uang kripto',
    icon: 'fas fa-coins',
    description: 'Tren harga terbaru dan regulasi aset digital.',
  },
  {
    title: 'Startup Asia',
    query: 'startup asia tenggara',
    icon: 'fas fa-rocket',
    description: 'Pendanaan dan cerita sukses perusahaan rintisan kawasan.',
  },
  {
    title: 'Kebijakan Publik',
    query: 'kebijakan publik indonesia',
    icon: 'fas fa-landmark',
    description: 'Reformasi dan dinamika politik di pemerintahan.',
  },
  {
    title: 'Inovasi Kesehatan',
    query: 'teknologi kesehatan',
    icon: 'fas fa-heartbeat',
    description: 'Penemuan medis dan layanan kesehatan digital.',
  },
  {
    title: 'Keamanan Siber',
    query: 'keamanan siber',
    icon: 'fas fa-shield-alt',
    description: 'Ancaman dan strategi melindungi data digital.',
  },
  {
    title: 'Mobil Listrik',
    query: 'kendaraan listrik',
    icon: 'fas fa-car-side',
    description: 'Perkembangan industri otomotif berbasis listrik.',
  },
  {
    title: 'Rantai Pasok',
    query: 'rantai pasok global',
    icon: 'fas fa-shipping-fast',
    description: 'Dinamika logistik dan pengaruh geopolitik.',
  },
  {
    title: 'Media Sosial',
    query: 'tren media sosial',
    icon: 'fas fa-hashtag',
    description: 'Platform populer dan budaya digital kekinian.',
  },
];

export const NICHE_FOCUS_AREAS = [
  {
    title: 'Ekonomi Kreator',
    icon: 'fas fa-video',
    description: 'Strategi konten, platform baru, dan peluang monetisasi kreator digital.',
    query: 'ekonomi kreator indonesia',
  },
  {
    title: 'Pertanian Cerdas',
    icon: 'fas fa-seedling',
    description: 'Teknologi agrikultur presisi, hydroponik, dan inovasi pangan lokal.',
    query: 'pertanian cerdas indonesia',
  },
  {
    title: 'Wisata Berkelanjutan',
    icon: 'fas fa-route',
    description: 'Destinasi wisata hijau dan prakarsa pariwisata bertanggung jawab.',
    query: 'pariwisata berkelanjutan nusantara',
  },
  {
    title: 'UMKM Digital',
    icon: 'fas fa-store',
    description: 'Transformasi usaha kecil melalui e-commerce dan platform digital.',
    query: 'UMKM digital indonesia',
  },
  {
    title: 'Teknologi Pendidikan',
    icon: 'fas fa-chalkboard-teacher',
    description: 'Solusi edtech, platform belajar mandiri, dan kebijakan pendidikan.',
    query: 'teknologi pendidikan indonesia',
  },
];
