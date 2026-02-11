# CI Testing Setup

This document describes the CI testing setup for the TFD Builds project, modeled after the tfd-cache project.

## What Was Added

### 1. GitHub Actions CI Workflow

- **File**: [.github/workflows/ci.yml](.github/workflows/ci.yml)
- **Triggers**: On pull requests and pushes to main branch
- **Jobs**:
  - **test**: Runs linting and tests
  - **build-test**: Verifies the Vite build works correctly

### 2. Testing Framework

- **Vitest**: Modern testing framework that works well with Vite
- **Basic test file**: [tests/basic.test.js](tests/basic.test.js)

### 3. Code Formatting

- **Prettier**: Code formatter for consistent code style
- **Configuration**: [.prettierrc](.prettierrc)
- **Ignore file**: [.prettierignore](.prettierignore)

### 4. Dependabot Configuration

- **File**: [.github/dependabot.yml](.github/dependabot.yml)
- **Purpose**: Automatically creates PRs for dependency updates
- **Schedule**: Weekly updates for npm packages and GitHub Actions

## NPM Scripts Added

The following scripts were added to [package.json](package.json):

```json
"test": "vitest run"           // Run tests once
"test:watch": "vitest"          // Run tests in watch mode
"format": "prettier --write ."  // Format all files
"format:check": "prettier --check ."  // Check formatting
"lint": "npm run format:check"  // Run linting (checks formatting)
```

## Dependencies Added

### Dev Dependencies

- `vitest` - Testing framework
- `@vitest/ui` - UI for test visualization
- `prettier` - Code formatter

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

### Formatting Your Code

Before committing, you may want to format your code:

```bash
npm run format
```

Note: Currently there are formatting issues in 32 files that need to be addressed if you want CI to pass with linting enabled.

### Optional: Setup Pre-commit Hooks

Like tfd-cache, you could add Husky for pre-commit hooks to automatically format code before commits:

```bash
npm install --save-dev husky lint-staged
npm run prepare
```

## Differences from tfd-cache

- **Testing Framework**: Uses Vitest instead of Jest (better Vite integration)
- **No Type Checking**: tfd-cache has TypeScript type checking, tfd-builds doesn't use TypeScript
- **Build Tool**: Uses Vite instead of Wrangler
- **No Deployment**: CI only tests and builds, doesn't deploy (can be added later)

## Status

✅ CI workflow created and ready to use
✅ Tests pass locally
⚠️ Formatting issues in existing files (run `npm run format` to fix)
