# Architecture Overview

This repository is organized as a monorepo managed with **Turborepo** and **pnpm**. Each directory under `apps/` and `packages/` represents an independent project that can share code through workspace dependencies.

```
merak/
├─ apps/
│  └─ web/              # Next.js front‑end
├─ packages/
│  ├─ sdk/              # TypeScript client library
│  ├─ ui/               # Shared React components
│  ├─ eslint-config/    # Reusable ESLint rules
│  └─ typescript-config/# Shared tsconfig bases
├─ contracts/           # Move smart contracts
└─ docs/                # Project documentation
```

The monorepo is built with Node.js **v18** or newer. All packages use the same `pnpm-lock.yaml` and are linked through the workspace configuration defined in `pnpm-workspace.yaml`.

Turborepo handles the build pipeline so tasks like `build`, `dev` and `test` run across the workspace with caching. Each package defines its own `package.json` but shares common linting and TypeScript configuration via workspace packages.
