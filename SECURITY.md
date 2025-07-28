# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of NoMoScroll Backend seriously. If you discover a security vulnerability, please follow these steps:

### Private Disclosure Process

1. **Do not** open a public GitHub issue for security vulnerabilities
2. **Email** the security team at [security@yourproject.com] with:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact assessment
   - Any suggested fixes (if you have them)

### What to Expect

- **Acknowledgment**: We'll acknowledge your report within 48 hours
- **Investigation**: We'll investigate and validate the vulnerability
- **Timeline**: We'll provide a timeline for fixing the issue
- **Credit**: We'll credit you in the security advisory (if desired)

### Security Measures

Our application implements several security measures:

- **Input Validation**: All requests are validated using middleware
- **Rate Limiting**: API endpoints are protected against abuse
- **CORS Protection**: Strict CORS policies for extension compatibility
- **Security Headers**: Helmet.js provides comprehensive security headers
- **Environment Variables**: Sensitive data stored in environment variables
- **Google Cloud Security**: Deployed on Google Cloud Run with security best practices

### Security Best Practices

When contributing to this project:

- **Never commit** API keys or secrets to the repository
- **Use environment variables** for all sensitive configuration
- **Validate all inputs** before processing
- **Follow OWASP guidelines** for web application security
- **Keep dependencies updated** to avoid known vulnerabilities

### Scope

This security policy applies to:

- The main application codebase
- API endpoints and middleware
- Deployment configurations
- Dependencies and third-party integrations

### Out of Scope

- Social engineering attacks
- Physical access to systems
- Third-party services (Google Cloud, Gemini API)
- Chrome extension vulnerabilities (separate repository)

Thank you for helping keep NoMoScroll Backend secure!
