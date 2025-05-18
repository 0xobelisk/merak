# Contracts

Move smart contracts that power the Merak protocol are stored in this directory. Use `Move.toml` to configure compilation and deployment settings.

- `merak/` – main protocol modules and tests
- `dubhe-framework/` – helper libraries shared across Move packages

Compile contracts with the Move CLI of the Sui toolchain. Contracts are independent from the TypeScript packages and are deployed separately.
