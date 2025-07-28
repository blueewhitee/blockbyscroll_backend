import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface AnalyzeRequestBody {
  content: string;
  context: {
    scrollCount: number;
    maxScrolls: number;
    domain: string;
    timestamp: number;
    timeOfDay: string;
    scrollTime: number;
  };
}

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only validate /api/analyze endpoint - let others pass through
    if (!req.path.includes('/api/analyze')) {
      return next();
    }

    const body = req.body as AnalyzeRequestBody;

    // Validate content field
    if (!body.content) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Missing required field: content',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof body.content !== 'string') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Field "content" must be a string',
        timestamp: new Date().toISOString()
      });
    }

    if (body.content.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Field "content" cannot be empty',
        timestamp: new Date().toISOString()
      });
    }

    // Validate context object
    if (!body.context) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Missing required field: context',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof body.context !== 'object') {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Field "context" must be an object',
        timestamp: new Date().toISOString()
      });
    }

    // Validate required context fields
    const requiredContextFields = ['scrollCount', 'maxScrolls', 'domain', 'timestamp', 'timeOfDay', 'scrollTime'];
    
    for (const field of requiredContextFields) {
      if (!(field in body.context)) {
        return res.status(400).json({
          error: 'Validation failed',
          message: `Missing required context field: ${field}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Validate field types and ranges
    const context = body.context;

    if (typeof context.scrollCount !== 'number' || context.scrollCount < 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Field "context.scrollCount" must be a non-negative number',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof context.maxScrolls !== 'number' || context.maxScrolls <= 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Field "context.maxScrolls" must be a positive number',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof context.domain !== 'string' || context.domain.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Field "context.domain" must be a non-empty string',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof context.timestamp !== 'number' || context.timestamp <= 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Field "context.timestamp" must be a positive number',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof context.timeOfDay !== 'string' || context.timeOfDay.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Field "context.timeOfDay" must be a non-empty string',
        timestamp: new Date().toISOString()
      });
    }

    if (typeof context.scrollTime !== 'number' || context.scrollTime < 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Field "context.scrollTime" must be a non-negative number',
        timestamp: new Date().toISOString()
      });
    }

    // Additional business logic validation
    if (context.scrollCount > context.maxScrolls + 100) { // Allow some buffer for edge cases
      logger.warn('Validation warning: scrollCount significantly exceeds maxScrolls', {
        scrollCount: context.scrollCount,
        maxScrolls: context.maxScrolls
      });
    }

    if (body.content.length > 500000) { // 500KB limit for content
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Content too large. Maximum size is 500KB',
        timestamp: new Date().toISOString()
      });
    }

    // Basic domain format validation (non-breaking)
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(context.domain)) {
      logger.warn('Validation warning: domain format unusual but allowing request', {
        domain: context.domain
      });
    }

    // All validations passed
    next();

  } catch (error) {
    logger.error('Validation middleware error', { 
      error: error instanceof Error ? error.message : String(error)
    });
    // Don't break the request on validation errors - log and continue
    logger.warn('Validation middleware encountered an error, allowing request to proceed');
    next();
  }
};