# `@repo/ui`

Reusable React components and utility hooks shared across the Merak applications.

## Development

Components are located under `src/components` and are styled with Tailwind CSS. Storybook is not configured, but you can run the web app locally to preview components in use.

Install dependencies and start developing:

```bash
pnpm install
pnpm dev
```

When publishing a component library, ensure exported modules are listed in `components.json` and covered by unit tests if applicable.
