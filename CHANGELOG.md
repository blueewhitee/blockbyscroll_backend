# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive request validation middleware
- Input sanitization and security checks
- Detailed API documentation
- GitHub repository preparation

### Changed
- Enhanced error handling and logging
- Improved security headers configuration

### Security
- Added content size limits to prevent DoS attacks
- Enhanced input validation for all endpoints

## [1.0.0] - 2025-07-26

### Added
- Initial release of NoMoScroll Backend
- Google Gemini AI integration for content analysis
- RESTful API with Express.js
- Rate limiting middleware (100 requests per 15 minutes)
- CORS configuration for Chrome/Firefox extensions
- Health check and readiness endpoints
- Google Cloud Run deployment support
- Docker containerization
- Comprehensive error handling
- Security headers with Helmet.js
- Environment-based configuration
- Google Cloud Secret Manager integration

### Features
- `/api/analyze` - AI content analysis endpoint
- `/api/test` - API connection testing
- `/health` - Health check endpoint
- `/ready` - Readiness check endpoint

### Security
- Input validation and sanitization
- Rate limiting protection
- CORS security for extension origins
- Security headers (CSP, HSTS, etc.)
- Environment variable protection

### Infrastructure
- Google Cloud Run deployment
- Docker support
- TypeScript compilation
- NPM package management
- Cloud logging integration
