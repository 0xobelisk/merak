# `@repo/typescript-config`

This package contains shared TypeScript configuration used across the monorepo. The presets can be extended in individual `tsconfig.json` files.

Available base configs:

- **base.json** – default configuration for Node.js projects
- **nextjs.json** – settings for Next.js applications
- **react-library.json** – settings for libraries of React components

To use a config, extend it in your project `tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist"
  }
}
```
