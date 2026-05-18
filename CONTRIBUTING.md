# Contributing to Sarva-Varadi

Thank you for your interest in contributing to Sarva-Varadi! 🎉

## Ways to Contribute

- 🐛 Report bugs and issues
- 💡 Suggest new features or improvements
- 📝 Improve documentation
- 🔧 Add support for new test frameworks
- ✨ Submit pull requests

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/sarva-varadi.git
   cd sarva-varadi
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Packages**
   ```bash
   npm run build
   ```

4. **Run Demo Tests**
   ```bash
   cd demo-playwright
   npm test
   ```

## Adding a New Framework Adapter

Want to add support for Cypress or another framework? Here's how:

**Currently Supported:**
- ✅ Playwright (TypeScript/JavaScript)
- ✅ Selenium (Java/TestNG)
- ✅ RestAssured (Java/TestNG)
- ✅ RestAssured (Java/JUnit 5)

**To Be Added:**
- 🚧 Cypress (community contributions welcome!)
- 💡 Mocha, Jest, JUnit, etc.

### 1. Create Package Structure

```bash
mkdir -p packages/<framework>
cd packages/<framework>
```

Create `package.json`:
```json
{
  "name": "@sarva-varadi/<framework>",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@sarva-varadi/core": "workspace:*"
  }
}
```

### 2. Implement Adapter

Create `src/index.ts`:
```typescript
import { BaseAdapter, SarvaTestResult } from '@sarva-varadi/core';

export class FrameworkAdapter extends BaseAdapter {
  // Convert framework's test results to SarvaTestResult format
  protected convertTestResult(test: FrameworkTest): SarvaTestResult {
    return {
      name: test.title,
      fullName: test.fullTitle,
      status: this.mapStatus(test.state),
      duration: test.duration,
      // ... map other fields
    };
  }
}
```

### 3. Add Demo Project

Create `demo-<framework>/` with:
- Sample test suite
- Framework configuration
- README with usage instructions

### 4. Update Documentation

- Add framework to README.md supported list
- Create quickstart guide
- Add example configuration

## Pull Request Process

1. **Create a branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests if applicable

3. **Build and test**
   ```bash
   npm run build
   npm test
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "feat: add support for Mocha framework"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Message Format

Use conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Examples:
- `feat: add Mocha adapter`
- `fix: flaky test detection for retried tests`
- `docs: update README with new features`

## Code Style

- Use TypeScript for all code
- Follow existing formatting (2 spaces, no semicolons)
- Add JSDoc comments for public APIs
- Keep functions focused and small

## Testing

- Run demo tests before submitting PR
- Verify reports generate correctly
- Check both `index.html` and `trends.html`
- Test on different browsers if applicable

## Questions?

- 💬 Open a [Discussion](https://github.com/yoggit/sarva-varadi/discussions)
- 🐛 Report an [Issue](https://github.com/yoggit/sarva-varadi/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making Sarva-Varadi better! ✨
