import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { GeminiService } from './services/gemini.service';
import { errorHandler } from './middleware/error.middleware';
import { validateRequest } from './middleware/validation.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { getGeminiApiKey, getGeminiConfig } from './config';
import { logger } from './utils/logger';

const app = express();

// Initialize Gemini service asynchronously
let geminiService: GeminiService;

async function initializeApp() {
  try {
    const apiKey = await getGeminiApiKey();
    const geminiConfig = getGeminiConfig(apiKey);
    geminiService = new GeminiService(geminiConfig);
    logger.info('Gemini service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Gemini service', { 
      error: error instanceof Error ? error.message : String(error)
    });
    process.exit(1); // Exit if API key is not available
  }
}

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Simple CORS fix for immediate testing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-HTTP-Method-Override');
  
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  next();
});

// Updated CORS for extension compatibility
app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    logger.debug('CORS request from origin', { origin });
    
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      logger.debug('Allowing request with no origin');
      callback(null, true);
      return;
    }

    // Allow Chrome and Firefox extension origins
    if (origin.startsWith('chrome-extension://') || 
        origin.startsWith('moz-extension://')) {
      logger.debug('Allowing extension origin', { origin });
      callback(null, true);
      return;
    }

    // Allow localhost for development
    if (origin.startsWith('http://localhost:') ||
        origin.startsWith('https://localhost:')) {
      logger.debug('Allowing localhost origin', { origin });
      callback(null, true);
      return;
    }

    // Allow HTTPS websites (for content scripts)
    if (origin.startsWith('https://')) {
      logger.debug('Allowing HTTPS origin', { origin });
      callback(null, true);
      return;
    }

    // Block everything else
    logger.warn('Blocking origin', { origin });
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-HTTP-Method-Override'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Additional explicit OPTIONS handler for troubleshooting
app.options('*', (req, res) => {
  logger.debug('Explicit OPTIONS request received', { 
    path: req.path,
    origin: req.get('Origin'),
    requestMethod: req.get('Access-Control-Request-Method'),
    requestHeaders: req.get('Access-Control-Request-Headers')
  });
  
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, X-HTTP-Method-Override');
  res.header('Access-Control-Max-Age', '3600');
  res.status(200).send();
});

// Enhanced logging for Cloud Run
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info('HTTP request', { 
        httpLog: message.trim()
      });
    }
  }
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check endpoint (required for Cloud Run)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'nomoscroll-backend',
    version: '1.0.0',
    nodejs: process.version
  });
});

// Readiness check
app.get('/ready', async (req, res) => {
  try {
    const isReady = await geminiService.testConnection();
    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: 'Service not ready',
      timestamp: new Date().toISOString()
    });
  }
});

// AI analysis endpoint
app.post('/api/analyze', validateRequest, async (req, res, next) => {
  try {
    const { content, context } = req.body;
    
    logger.info('Analysis request received', {
      domain: context.domain,
      scrollCount: context.scrollCount,
      contentLength: content.length
    });
    
    const result = await geminiService.analyzeContent({
      content,
      context
    });
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  } catch (error) {
    next(error);
  }
});

// Test connection endpoint
app.get('/api/test', async (req, res, next) => {
  try {
    const isConnected = await geminiService.testConnection();
    res.json({
      success: true,
      connected: isConnected,
      model: geminiService.getConfig().model,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  logger.warn('404 Not Found', { 
    method: req.method,
    path: req.originalUrl 
  });
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Initialize the app and start the server
initializeApp().then(() => {
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
        logger.info('Server started successfully', { port });
    });
}).catch(err => {
    logger.error('Application initialization failed', { 
      error: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
});
