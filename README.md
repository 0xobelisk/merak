# Merak Monorepo

This repository contains the Merak protocol SDK and web application. The project uses **pnpm** and **Turborepo** to manage multiple packages.

## Apps and Packages

- **apps/web** – Next.js front‑end
- **packages/sdk** – TypeScript SDK for interacting with Merak
- **packages/ui** – Shared React components
- **packages/eslint-config** – Shared ESLint rules
- **packages/typescript-config** – Shared TypeScript configuration

## Development

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


# sov-front-end-template

## Running Tests

The repository uses [Vitest](https://vitest.dev/) for unit testing. After
installing dependencies with `pnpm`, run:

```sh
pnpm test
```

This command runs tests across all packages via Turborepo.

A GitHub Actions workflow installs dependencies and runs `pnpm lint`, `pnpm build` and `pnpm test` for pull requests.

