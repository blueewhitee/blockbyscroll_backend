# Contributing to NoMoScroll Backend

Thank you for your interest in contributing to NoMoScroll Backend! This document provides guidelines and information for contributors.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/nomoscroll-backend.git
   cd nomoscroll-backend
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment variables** (see README.md)
5. **Build and test**:
   ```bash
   npm run build
   npm start
   ```

## 🌟 How to Contribute

### Reporting Issues

- **Search existing issues** before creating a new one
- **Use the issue template** when available
- **Provide clear steps to reproduce** the problem
- **Include relevant logs** and error messages
- **Specify your environment** (Node.js version, OS, etc.)

### Suggesting Features

- **Check existing feature requests** first
- **Describe the use case** and problem you're solving
- **Provide mockups or examples** if applicable
- **Consider backward compatibility** implications

### Code Contributions

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow the coding standards below
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**:
   ```bash
   npm run build
   npm start
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## 📝 Coding Standards

### TypeScript Guidelines

- **Use strict TypeScript** configuration
- **Define interfaces** for all data structures
- **Use explicit return types** for functions
- **Avoid `any` type** - use specific types or generics
- **Use meaningful variable names**

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use semicolons
- **Line length**: Maximum 100 characters
- **Naming**: camelCase for variables/functions, PascalCase for classes

### Example:

```typescript
interface UserRequest {
  content: string;
  context: {
    scrollCount: number;
    domain: string;
  };
}

export const validateUserRequest = (req: Request): boolean => {
  // Implementation here
  return true;
};
```

### Error Handling

- **Always handle errors** gracefully
- **Use try-catch blocks** for async operations
- **Provide meaningful error messages**
- **Log errors** with appropriate context

```typescript
try {
  const result = await geminiService.analyzeContent(request);
  return result;
} catch (error) {
  console.error('Failed to analyze content:', error);
  throw new Error('Content analysis failed');
}
```

### Security Guidelines

- **Validate all inputs** using middleware
- **Sanitize user data** before processing
- **Use environment variables** for secrets
- **Implement rate limiting** for endpoints
- **Follow OWASP guidelines**

## 🧪 Testing

### Running Tests

Currently, the project doesn't have automated tests, but we encourage:

- **Manual testing** of API endpoints
- **Integration testing** with the Chrome extension
- **Load testing** for production scenarios

### Test Checklist

When contributing, please verify:

- [ ] API endpoints respond correctly
- [ ] Error handling works as expected
- [ ] Rate limiting functions properly
- [ ] CORS headers are set correctly
- [ ] Environment variables are handled safely
- [ ] Build process completes without errors

## 📚 Documentation

### Code Documentation

- **Add JSDoc comments** for functions and classes
- **Document complex logic** with inline comments
- **Update README.md** for new features
- **Include API examples** in documentation

### Commit Messages

Use conventional commit format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or modifying tests
- `chore:` - Maintenance tasks

Examples:
- `feat: add content validation middleware`
- `fix: resolve CORS issue with extension origins`
- `docs: update API documentation for /analyze endpoint`

## 🔍 Code Review Process

### Pull Request Guidelines

- **Provide clear description** of changes
- **Reference related issues** using keywords (fixes #123)
- **Keep PRs focused** - one feature/fix per PR
- **Update documentation** as needed
- **Ensure CI passes** (build succeeds)

### Review Criteria

- **Code quality** and adherence to standards
- **Security implications** of changes
- **Performance impact** assessment
- **Backward compatibility** considerations
- **Documentation completeness**

## 🌍 Community Guidelines

### Code of Conduct

- **Be respectful** and inclusive
- **Provide constructive feedback**
- **Help newcomers** get started
- **Focus on the problem**, not the person
- **Follow GitHub's community guidelines**

### Communication

- **Use GitHub issues** for bug reports and feature requests
- **Use GitHub discussions** for questions and ideas
- **Be patient** - maintainers are volunteers
- **Provide context** when asking questions

## 🏷️ Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] Update version in `package.json`
- [ ] Update CHANGELOG.md
- [ ] Test in production environment
- [ ] Create GitHub release
- [ ] Deploy to production

## 📞 Getting Help

- **Check the README.md** first
- **Search existing issues** and discussions
- **Ask questions** in GitHub discussions
- **Provide context** when asking for help

## 🎯 Priority Areas

We especially welcome contributions in these areas:

- **Test coverage** - Adding automated tests
- **Performance optimization** - Improving response times
- **Security enhancements** - Additional security measures
- **Documentation** - Improving guides and examples
- **Error handling** - Better error messages and recovery

Thank you for contributing to NoMoScroll Backend! 🙏
