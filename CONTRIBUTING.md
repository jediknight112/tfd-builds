# Contributing to TFD Builds

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/tfd-builds.git`
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`

See the [Quick Start Guide](docs/QUICKSTART.md) for more details.

## Development Guidelines

### Tech Stack

This project intentionally uses **vanilla JavaScript** -- no frameworks. Please do not introduce React, Vue, Angular, or similar.

### Code Style

- **ES6+ modules** (`import`/`export`)
- `const` and `let` only (no `var`)
- Arrow functions for callbacks
- Template literals for string interpolation
- Destructuring where appropriate
- **Tailwind CSS** utility classes for all styling (no inline styles)

Code is formatted with Prettier. Run `npm run format` before committing.

### Architecture

- **State**: All application state lives in `src/state.js`. Don't create separate state stores.
- **Modules**: Feature code goes in `src/modules/`. Each module is self-contained.
- **UI Components**: Reusable elements are factory functions in `src/ui-components.js`.
- **API**: All backend calls go through `src/api-client.js`.

### Testing

- Write tests for new business logic in the `tests/` directory
- Use Vitest: `npm test`
- Test file naming: `*.test.js`

## Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Format your code: `npm run format`
4. Run tests: `npm test`
5. Build to verify: `npm run build`
6. Commit with a clear message
7. Push and open a pull request

## Pull Request Process

- Describe what your PR does and why
- Reference any related issues
- Ensure CI passes (tests, linting, build)
- Keep PRs focused -- one feature or fix per PR

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- For security vulnerabilities, see [SECURITY.md](SECURITY.md)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
