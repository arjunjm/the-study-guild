import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import usersRouter from './routes/users';
import coursesRouter from './routes/courses';
import lessonsRouter from './routes/lessons';
import progressRouter from './routes/progress';
import leaderboardRouter from './routes/leaderboard';

const app = express();

app.use(helmet());
const allowedOrigins = env.isDev
  ? ['http://localhost:5173', 'http://localhost:5174']
  : (process.env.CLIENT_ORIGIN ?? '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
  credentials: true,
}));
app.use(morgan(env.isDev ? 'dev' : 'combined'));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'study-guild-api' }));

app.use('/api/users', usersRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/courses/:courseId/lessons', lessonsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/leaderboard', leaderboardRouter);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[study-guild] Server running on http://localhost:${env.port}`);
});

export default app;
