# NoMoScroll Backend

A secure Node.js backend service for the NoMoScroll Chrome Extension that provides AI-powered content analysis using Google's Gemini API to help users manage their digital wellness and scrolling behavior.

## 🚀 Features

- **AI Content Analysis**: Uses Google Gemini 2.0 Flash Lite for intelligent content pattern recognition
- **Digital Wellness**: Analyzes user scrolling behavior and provides personalized recommendations
- **Secure Architecture**: Implements rate limiting, request validation, and security headers
- **Cloud-Ready**: Designed for Google Cloud Run deployment
- **Extension Integration**: CORS-enabled for Chrome/Firefox extension compatibility

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Prerequisites

- **Node.js** >= 22.0.0
- **npm** or **pnpm**
- **Google Gemini API Key**
- **Google Cloud Project** (for production deployment)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nomoscroll-backend.git
   cd nomoscroll-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - Model Configuration
GEMINI_MODEL=gemini-2.0-flash-lite
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=2048

# Optional - Server Configuration
PORT=8080

# Production - Google Cloud Configuration
GCP_PROJECT=your-gcp-project-id
GEMINI_API_KEY_SECRET=GEMINI_API_KEY
```

### Getting a Gemini API Key

1. Visit the [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

## 🚀 Usage

### Development Server

```bash
npm start
```

The server will start on `http://localhost:8080` (or your configured PORT).

### Available Scripts

- `npm start` - Build and start the production server
- `npm run build` - Compile TypeScript to JavaScript
- `npm run deploy` - Deploy to Google Cloud Run

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:8080`
- **Production**: `https://your-cloud-run-url`

### Endpoints

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-26T10:30:00.000Z",
  "service": "nomoscroll-backend",
  "version": "1.0.0",
  "nodejs": "v22.0.0"
}
```

#### Readiness Check
```http
GET /ready
```

**Response:**
```json
{
  "ready": true,
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

#### Content Analysis
```http
POST /api/analyze
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Content to analyze",
  "context": {
    "scrollCount": 15,
    "maxScrolls": 30,
    "domain": "example.com",
    "timestamp": 1690365000000,
    "timeOfDay": "10:30:00 AM",
    "scrollTime": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_pattern": "Deep Focus/Learning",
    "addiction_risk": 3,
    "educational_value": 8,
    "recommended_action": "session_extension",
    "bonus_scrolls": 15,
    "reasoning": "User is engaged in educational content",
    "break_suggestion": null
  },
  "timestamp": "2025-07-26T10:30:00.000Z",
  "requestId": "req_1690365000000_abc123"
}
```

#### Test Connection
```http
GET /api/test
```

**Response:**
```json
{
  "success": true,
  "connected": true,
  "model": "gemini-2.0-flash-lite",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### Error Responses

All error responses follow this format:
```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2025-07-26T10:30:00.000Z"
}
```

### Rate Limiting

- **Rate Limit**: 100 requests per 15-minute window per IP
- **Response Header**: `X-RateLimit-*` headers included
- **Error Code**: `429 Too Many Requests`

## 🏗️ Architecture

```
src/
├── config.ts              # Configuration and secrets management
├── server.ts              # Main Express application
├── middleware/
│   ├── error.middleware.ts      # Global error handling
│   ├── rate-limit.middleware.ts # Rate limiting
│   └── validation.middleware.ts # Request validation
└── services/
    └── gemini.service.ts       # Google Gemini API integration
```

### Key Components

- **Express Server**: RESTful API with security middleware
- **Gemini Service**: AI content analysis integration
- **Validation Middleware**: Request validation and sanitization
- **Rate Limiting**: IP-based request throttling
- **Error Handling**: Centralized error management
- **Security**: Helmet.js security headers and CORS configuration

## ☁️ Deployment

### Google Cloud Run

1. **Build and deploy**:
   ```bash
   npm run deploy
   ```

2. **Manual deployment**:
   ```bash
   gcloud run deploy nomoscroll-backend \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Docker

1. **Build image**:
   ```bash
   docker build -t nomoscroll-backend .
   ```

2. **Run container**:
   ```bash
   docker run -p 8080:8080 \
     -e GEMINI_API_KEY=your_api_key \
     nomoscroll-backend
   ```

### Environment Setup

For production deployment, ensure:
- Google Cloud Project is configured
- Gemini API key is available (environment variable or Secret Manager)
- Proper IAM permissions for Secret Manager (if used)

## 💻 Development

### Project Structure

- **TypeScript**: Fully typed codebase
- **Express.js**: Web framework
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Morgan HTTP request logger
- **Error Handling**: Centralized error middleware

### Development Workflow

1. Make changes to TypeScript files in `src/`
2. Build with `npm run build`
3. Test locally with `npm start`
4. Deploy with `npm run deploy`

### Code Quality

- **TypeScript**: Strict type checking enabled
- **Error Handling**: Comprehensive error management
- **Security**: Security headers and input validation
- **Logging**: Structured logging for monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add proper error handling
- Include input validation
- Update documentation
- Test your changes locally

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Open an issue on GitHub
- Check the [API Documentation](#api-documentation)
- Review the [troubleshooting section](#troubleshooting)

## 🔧 Troubleshooting

### Common Issues

**CORS Errors**:
- Ensure your extension origin is allowed
- Check console logs for CORS details

**API Key Issues**:
- Verify `GEMINI_API_KEY` environment variable
- Check Google AI Studio for key validity

**Rate Limiting**:
- Default limit is 100 requests per 15 minutes
- Adjust in `rate-limit.middleware.ts` if needed

**Cloud Run Deployment**:
- Ensure proper GCP project configuration
- Check service account permissions

---

**Built with ❤️ for digital wellness**
