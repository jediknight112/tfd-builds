# CI Testing Setup

This document describes the CI/CD pipeline for the TFD Builds project.

## Overview

### GitHub Actions CI Workflow

- **File**: [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- **Triggers**: On pull requests and pushes to main branch
- **Jobs**:
  - **test**: Runs linting and tests
  - **build-test**: Verifies the Vite build works correctly

### Automated Deployment

- **File**: [.github/workflows/deploy.yml](../.github/workflows/deploy.yml)
- **Triggers**: After CI passes on main branch
- **Deploys**: To Cloudflare Workers

### Dependabot

- **File**: [.github/dependabot.yml](../.github/dependabot.yml)
- Automatically creates PRs for dependency updates (weekly)

## Tools

- **Vitest**: Testing framework (integrates with Vite)
- **Prettier**: Code formatting ([.prettierrc](../.prettierrc))

## Running Tests Locally

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Check code formatting
npm run lint

# Auto-fix code formatting
npm run format

# Build the project
npm run build
```

## CI Pipeline Flow

When you push code or create a pull request:

1. **Checkout**: Code is checked out from the repository
2. **Setup**: Node.js 20 is installed with npm cache
3. **Install**: Dependencies are installed
4. **Lint**: Code formatting is checked with Prettier
5. **Test**: Unit tests are run with Vitest
6. **Build**: Project is built with Vite to ensure no build errors

## Next Steps

### Adding More Tests

Create additional test files in the `tests/` directory:

```javascript
// tests/example.test.js
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

### Code Formatting

Format your code before committing:

```bash
npm run format
```
