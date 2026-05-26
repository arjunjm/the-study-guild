import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'ValidationError',
      message: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      statusCode: 400,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error(err);
  res.status(500).json({ error: 'InternalError', message, statusCode: 500 });
}
