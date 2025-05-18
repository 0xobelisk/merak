# `@repo/eslint-config`

Shared ESLint configurations used throughout the monorepo. Extend one of the provided configs in your project `.eslintrc`:

```json
{
  "extends": ["@repo/eslint-config/next"]
}
```

Available configs include `library`, `next` and `react-internal`. They enforce the Merak coding style and integrate Prettier formatting rules.
