import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { GeminiService } from './services/gemini.service';
import { errorHandler } from './middleware/error.middleware';
import { validateRequest } from './middleware/validation.middleware';
import { rateLimiter } from './middleware/rate-limit.middleware';
import { getGeminiApiKey } from './config';

const app = express();

// Initialize Gemini service asynchronously
let geminiService: GeminiService;

async function initializeApp() {
  try {
    const apiKey = await getGeminiApiKey();
    geminiService = new GeminiService({
      apiKey,
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite',
      temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2048'),
    });
    console.log('Gemini service initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini service:', error);
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
    console.log('CORS: Request from origin:', origin);
    
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      callback(null, true);
      return;
    }

    // Allow Chrome and Firefox extension origins
    if (origin.startsWith('chrome-extension://') || 
        origin.startsWith('moz-extension://')) {
      console.log('CORS: Allowing extension origin:', origin);
      callback(null, true);
      return;
    }

    // Allow localhost for development
    if (origin.startsWith('http://localhost:') ||
        origin.startsWith('https://localhost:')) {
      console.log('CORS: Allowing localhost origin:', origin);
      callback(null, true);
      return;
    }

    // Allow HTTPS websites (for content scripts)
    if (origin.startsWith('https://')) {
      console.log('CORS: Allowing HTTPS origin:', origin);
      callback(null, true);
      return;
    }

    // Block everything else
    console.log('CORS: Blocking origin:', origin);
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
  console.log('OPTIONS: Explicit OPTIONS request received for:', req.path);
  console.log('OPTIONS: Origin:', req.get('Origin'));
  console.log('OPTIONS: Access-Control-Request-Method:', req.get('Access-Control-Request-Method'));
  console.log('OPTIONS: Access-Control-Request-Headers:', req.get('Access-Control-Request-Headers'));
  
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
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: message.trim(),
        service: 'nomoscroll-backend'
      }));
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
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Analysis request for domain: ${context.domain}`,
      scrollCount: context.scrollCount,
      contentLength: content.length
    }));
    
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
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite',
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
  console.error(`404 Not Found: The endpoint "${req.method} ${req.originalUrl}" does not exist.`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Initialize the app and start the server
initializeApp().then(() => {
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}).catch(err => {
    console.error("Application initialization failed", err);
    process.exit(1);
});
