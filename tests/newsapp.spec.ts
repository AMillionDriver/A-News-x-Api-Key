import { test, expect, Page } from '@playwright/test';

type Article = {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  publishedAt: string;
  source: { name: string };
};

type GNewsResponse = {
  totalArticles: number;
  articles: Article[];
};

const mockArticlesPage1: Article[] = [
  {
    title: 'Halaman 1 - Artikel 1',
    description: 'Ringkasan singkat artikel pertama.',
    url: 'https://contoh.id/artikel-1',
    image: null,
    publishedAt: '2025-02-01T08:00:00Z',
    source: { name: 'Sumber A' },
  },
  {
    title: 'Halaman 1 - Artikel 2',
    description: 'Ringkasan singkat artikel kedua.',
    url: 'https://contoh.id/artikel-2',
    image: 'https://placehold.co/600x400/png',
    publishedAt: '2025-02-02T10:30:00Z',
    source: { name: 'Sumber B' },
  },
  {
    title: 'Halaman 1 - Artikel 3',
    description: 'Ringkasan singkat artikel ketiga.',
    url: 'https://contoh.id/artikel-3',
    image: 'https://placehold.co/600x400/png?text=Artikel+3',
    publishedAt: '2025-02-03T12:45:00Z',
    source: { name: 'Sumber C' },
  },
];

const mockArticlesPage2: Article[] = [
  {
    title: 'Halaman 2 - Artikel 1',
    description: 'Konten halaman kedua artikel pertama.',
    url: 'https://contoh.id/artikel-4',
    image: 'https://placehold.co/600x400/png?text=Artikel+4',
    publishedAt: '2025-02-04T09:15:00Z',
    source: { name: 'Sumber D' },
  },
  {
    title: 'Halaman 2 - Artikel 2',
    description: 'Konten halaman kedua artikel kedua.',
    url: 'https://contoh.id/artikel-5',
    image: 'https://placehold.co/600x400/png?text=Artikel+5',
    publishedAt: '2025-02-05T14:05:00Z',
    source: { name: 'Sumber E' },
  },
  {
    title: 'Halaman 2 - Artikel 3',
    description: 'Konten halaman kedua artikel ketiga.',
    url: 'https://contoh.id/artikel-6',
    image: 'https://placehold.co/600x400/png?text=Artikel+6',
    publishedAt: '2025-02-06T17:20:00Z',
    source: { name: 'Sumber F' },
  },
];

const responseFor = (page: number): GNewsResponse => ({
  totalArticles: 12,
  articles: page === 2 ? mockArticlesPage2 : mockArticlesPage1,
});

async function mockNewsApi(page: Page, requestedPages: string[], missingPageParam: { count: number }) {
  await page.route('**/api/v4/search**', async (route) => {
    const url = new URL(route.request().url());
    const pageParam = url.searchParams.get('page');
    if (!pageParam) {
      missingPageParam.count += 1;
    }
    requestedPages.push(pageParam ?? '1');

    const numericPage = Number(pageParam ?? '1');
    const payload = responseFor(Number.isNaN(numericPage) ? 1 : numericPage);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}

test.describe('NewsApp UI', () => {
  test('menampilkan artikel awal dan info paginasi', async ({ page }) => {
    const requestedPages: string[] = [];
    const missingPageParam = { count: 0 };
    await mockNewsApi(page, requestedPages, missingPageParam);

    await page.goto('/');
    await expect(page.locator('#newsGrid article')).toHaveCount(mockArticlesPage1.length);
    await expect(page.locator('#pageInfo')).toHaveText('Halaman 1 dari 2');
    await expect(page.locator('#prevPage')).toBeDisabled();
    await expect(page.locator('#nextPage')).toBeEnabled();

    expect(requestedPages).toContain('1');
    expect(missingPageParam.count).toBe(0);
  });

  test('navigasi paginasi mengambil halaman berbeda', async ({ page }) => {
    const requestedPages: string[] = [];
    const missingPageParam = { count: 0 };
    await mockNewsApi(page, requestedPages, missingPageParam);

    await page.goto('/');
    await expect(page.locator('#newsGrid article')).toHaveCount(mockArticlesPage1.length);

    await Promise.all([
      page.waitForResponse((response) => response.url().includes('gnews.io/api/v4/search') &&
        response.request().method() === 'GET' &&
        new URL(response.url()).searchParams.get('page') === '2'),
      page.click('#nextPage'),
    ]);

    await expect(page.locator('#newsGrid article').first()).toContainText('Halaman 2 - Artikel 1');
    await expect(page.locator('#pageInfo')).toHaveText('Halaman 2 dari 2');
    await expect(page.locator('#nextPage')).toBeDisabled();
    await expect(page.locator('#prevPage')).toBeEnabled();

    await Promise.all([
      page.waitForResponse((response) => response.url().includes('gnews.io/api/v4/search') &&
        response.request().method() === 'GET' &&
        new URL(response.url()).searchParams.get('page') === '1'),
      page.click('#prevPage'),
    ]);

    await expect(page.locator('#pageInfo')).toHaveText('Halaman 1 dari 2');
    expect(requestedPages.filter((pageNumber) => pageNumber === '2').length).toBeGreaterThan(0);
    expect(missingPageParam.count).toBe(0);
  });

  test('toggle mode gelap menambahkan class dan tersimpan', async ({ page }) => {
    const missingPageParam = { count: 0 };
    await mockNewsApi(page, [], missingPageParam);

    await page.goto('/');
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/\bdark\b/);

    await page.click('#darkModeToggle');
    await expect(html).toHaveClass(/\bdark\b/);

    await page.reload();
    await expect(html).toHaveClass(/\bdark\b/);
    expect(missingPageParam.count).toBe(0);
  });

  test('menu mobile dapat dibuka dan ditutup', async ({ page }) => {
    const missingPageParam = { count: 0 };
    await mockNewsApi(page, [], missingPageParam);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const menu = page.locator('#mobileMenu');
    const hiddenState = async () =>
      menu.evaluate((node) => node.classList.contains('hidden'));

    await expect.poll(hiddenState).toBe(true);

    await page.click('#mobileMenuButton');
    await expect.poll(hiddenState).toBe(false);
    await expect(page.locator('#mobileMenuButton')).toHaveAttribute('aria-expanded', 'true');

    await page.click('#mobileMenuButton');
    await expect.poll(hiddenState).toBe(true);
    await expect(page.locator('#mobileMenuButton')).toHaveAttribute('aria-expanded', 'false');
    expect(missingPageParam.count).toBe(0);
  });
});
