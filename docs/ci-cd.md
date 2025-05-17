# Continuous Integration

GitHub Actions is used to lint, build and test the workspace on every pull request. The workflow is defined in `.github/workflows/ci.yml` and performs the following steps:

1. Checkout the repository and install Node.js v18.
2. Install `pnpm@9` and restore cached dependencies.
3. Run `pnpm lint` to ensure code style and formatting.
4. Run `pnpm build` to compile all packages.
5. Run `pnpm test` to execute unit tests if present.

Use the workflow logs to debug CI failures. Keeping all packages lint-free ensures a smooth build and deployment process.
