# SDK Usage

The `@repo/sdk` package provides utilities to interact with the Merak protocol. Install it from the workspace root:

```bash
pnpm add @repo/sdk
```

A basic example:

```ts
import { MerakClient } from '@repo/sdk'

const client = new MerakClient({ network: 'testnet' })
const pools = await client.getPools()
console.log(pools)
```

Consult the package README for additional APIs and configuration options.
