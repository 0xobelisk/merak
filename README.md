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

### Continuous Integration

A GitHub Actions workflow installs dependencies and runs `pnpm lint`, `pnpm build` and `pnpm test` for pull requests.
