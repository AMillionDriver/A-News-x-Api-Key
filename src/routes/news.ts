import { Router } from 'express';
import createHttpError from 'http-errors';
import { appConfig } from '../config/env';
import { fetchNews } from '../services/newsService';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const queryParam = typeof req.query.query === 'string' ? req.query.query : '';
    const categoryParam = typeof req.query.category === 'string' ? req.query.category : '';

    const pageParam = Array.isArray(req.query.page) ? req.query.page[0] : req.query.page;
    const pageSizeParam = Array.isArray(req.query.pageSize) ? req.query.pageSize[0] : req.query.pageSize;

    const page = Number.parseInt((pageParam as string) ?? '1', 10);
    const pageSize = Number.parseInt((pageSizeParam as string) ?? String(appConfig.defaultPageSize), 10);

    if (Number.isNaN(page) || page < 1) {
      throw createHttpError(400, 'Parameter halaman tidak valid.');
    }

    if (Number.isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      throw createHttpError(400, 'Parameter ukuran halaman tidak valid.');
    }

    const result = await fetchNews({
      query: queryParam,
      category: categoryParam,
      page,
      pageSize,
    });

    res.json({
      totalArticles: result.totalArticles,
      articles: result.articles,
      cached: result.cached,
      page,
      pageSize,
    });
  }),
);

export const newsRouter = router;
