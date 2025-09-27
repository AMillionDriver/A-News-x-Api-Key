import compression from 'compression';
import cors from 'cors';
import express, { Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { appConfig } from './config/env';
import { apiNotFoundHandler, errorHandler } from './middleware/errorHandler';
import { newsRouter } from './routes/news';

const app = express();

app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

if (appConfig.env !== 'production') {
  app.use(cors());
}

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(appConfig.env === 'production' ? 'combined' : 'dev'));

app.use('/api/news', newsRouter);
app.use('/api', apiNotFoundHandler);

const publicDir = path.join(__dirname, '../public');

app.use(express.static(publicDir, { maxAge: '1d', extensions: ['html'] }));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.use(errorHandler);

export { app };
