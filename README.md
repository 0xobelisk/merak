# Merak Monorepo

This repository contains the Merak protocol SDK and web application. The project uses **pnpm** and **Turborepo** to manage multiple packages.

## Documentation

Additional guides can be found in the `docs/` directory:
- [Architecture](docs/architecture.md)
- [Contracts](docs/contracts.md)
- [SDK Usage](docs/sdk.md)
- [Continuous Integration](docs/ci-cd.md)
- [Getting Started](docs/getting-started.md)

## Apps and Packages

- **apps/web** – Next.js front‑end
- **packages/sdk** – TypeScript SDK for interacting with Merak
- **packages/ui** – Shared React components
- **packages/eslint-config** – Shared ESLint rules
- **packages/typescript-config** – Shared TypeScript configuration

## Development

Use **Node.js v18**. An `.nvmrc` file is provided for use with [nvm](https://github.com/nvm-sh/nvm).

Install dependencies and start developing:

```bash
pnpm install
pnpm dev
```

To build all packages:

```bash
pnpm build
```

### Running tests

Tests are executed with [Vitest](https://vitest.dev/):

```bash
pnpm test
```

## Error Monitoring with Sentry

This project integrates [Sentry](https://sentry.io/) for runtime error tracking.
Set the environment variable `SENTRY_DSN` (or `NEXT_PUBLIC_SENTRY_DSN` for
browser reporting) before running the application so that errors are reported to
your Sentry project.
All application pages are wrapped in a `Sentry.ErrorBoundary` to ensure
unhandled errors are captured during runtime.

## Testing

Run all unit tests across packages:

```sh
pnpm test
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)

Learn more about shadcn/ui:

- [Documentation](https://ui.shadcn.com/docs)
### Continuous Integration

A GitHub Actions workflow installs dependencies and runs `pnpm lint`, `pnpm build` and `pnpm test` for pull requests.


## Front-End Performance and Caching

- **Code Splitting** – Load modules only when needed with Next.js dynamic imports.
- **Asset Caching** – Serve static assets through a CDN with long-lived `Cache-Control` headers.
- **HTTP Caching** – Use `ETag` or `Last-Modified` headers so browsers can reuse responses.
- **Service Workers** – Optionally cache routes and API responses for offline support.
- **Image Optimization** – Use the Next.js `Image` component for automatic sizing and compression.
- **Lazy Loading** – Defer non-critical components and images using dynamic imports and the `loading` attribute.
- **Compression** – Enable gzip or Brotli compression on the server for faster transfers.
- **Memoization** – Apply React memoization and virtualization to reduce re-renders.
- **Build Caching** – Turborepo's cache speeds up builds and tasks across packages.
- **Version Checking** – The `useForceClientUpdate` hook reloads the page when a new build is available.
