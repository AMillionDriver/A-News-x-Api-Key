import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';
import { appConfig } from '../config/env';

const isApiRequest = (req: Request): boolean => req.path.startsWith('/api/');

export const apiNotFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(createHttpError(404, 'Endpoint tidak ditemukan.'));
};

export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const status = typeof (error as any)?.status === 'number' ? (error as any).status : 500;
  const message =
    typeof (error as any)?.message === 'string' && status !== 500
      ? (error as any).message
      : 'Terjadi kesalahan internal. Silakan coba lagi.';

  if (appConfig.env !== 'test') {
    // eslint-disable-next-line no-console
    console.error('[Error]', {
      status,
      message: (error as any)?.message,
      stack: (error as any)?.stack,
    });
  }

  if (isApiRequest(req)) {
    res.status(status).json({ message, status });
    return;
  }

  res.status(status).send(message);
};
