import express from 'express';
import path from 'path';
import { app } from './src/server/app.ts';

app.use(
  '/images',
  express.static(path.resolve(process.cwd(), 'public/images'))
);

async function startServer() {
  const port = Number(process.env.PORT) || 3000;
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`PetKin server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
