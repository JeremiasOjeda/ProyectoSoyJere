import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { cacheMiddleware } from './middleware/cache.js';
import versionRouter from './routes/version.js';
import authRouter from './routes/auth.js';
import { createSocketServer } from './socket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cacheMiddleware);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', versionRouter);
app.use('/api/auth', authRouter);

createSocketServer(httpServer);

if (isProd) {
  const distPath = path.resolve(__dirname, '..');
  app.use(express.static(distPath, { index: false }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
