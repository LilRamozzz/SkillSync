import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config, initDb } from './config/db';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import knowledgeRoutes from './routes/knowledge';
import matchRoutes from './routes/matches';
import rankingRoutes from './routes/ranking';
import conversationRoutes from './routes/conversations';

dotenv.config();

const app = express();
app.use(cors({ origin: config.frontendUrl, credentials: false }));
app.use(express.json({ limit: '256kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'skillsync-backend', ts: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/conversations', conversationRoutes);

// 404 API
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

async function main(): Promise<void> {
  await initDb();
  app.listen(config.port, () => {
    console.log(`[skillsync] Backend escuchando en http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Error fatal al iniciar:', err);
  process.exit(1);
});