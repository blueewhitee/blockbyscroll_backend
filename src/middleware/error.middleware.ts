import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error occurred', { 
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).send('Something broke!');
};