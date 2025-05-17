# AGENTS Instructions

This repository is a pnpm based monorepo that contains several apps and packages.

## Development guidelines

- Use **Node.js v18** or newer and install dependencies with `pnpm`.
- Preferred package manager is `pnpm@9` as defined in `package.json`.
- Run `pnpm lint` and ensure no ESLint errors before committing.
- Keep code formatted with Prettier (most editors can run this automatically).
- Do not commit files listed in `.gitignore` such as build outputs or environment files.
- Describe significant changes in the relevant `README.md` when appropriate.

## Testing

There are currently no automated tests in this repo. If you add tests in the future,
provide a script named `test` in the root `package.json` and document how to run it.

