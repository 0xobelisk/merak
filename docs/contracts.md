# Smart Contracts

The `contracts/` folder contains Move modules that implement the Merak protocol. Two separate packages are currently provided:

- **merak** – core modules for on-chain logic
- **dubhe-framework** – supporting framework libraries

Each package includes a `Move.toml` manifest and the contract sources under `sources/`. When making changes, be sure to update the manifests and run the appropriate Move compiler.

Contracts are versioned independently from the TypeScript packages and are deployed to the Sui network. Refer to each `Move.toml` for network configuration and dependencies.
