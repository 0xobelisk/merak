# Merak SDK

A TypeScript client library for interacting with Merak protocol contracts. The SDK wraps common on-chain queries and transactions to provide a convenient API for JavaScript applications.

## Installation

```bash
pnpm add @repo/sdk
```

## Usage

```ts
import { MerakClient } from '@repo/sdk'

const client = new MerakClient({ network: 'testnet' })
const pools = await client.getPools()
```

## Development

Source code lives under `src/` and tests under `test/`. Build the package with:

```bash
pnpm build
```

Run unit tests with:

```bash
pnpm test packages/sdk
```
