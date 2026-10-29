# BitePick — What should we eat?

A local-first food picker built with Next.js, TypeScript, Tailwind CSS, Radix UI and Motion. No backend, account or API keys.

## Run

Requires Node.js 24 (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000). `npm run check` runs typecheck, lint, tests and build.

## Features

- **Wheel / Quick Pick**: two ways to draw from the same candidate pool.
- **Menu**: add, edit, toggle, search, bulk-delete foods and manage categories; restore the 11 defaults anytime.
- **History**: confirmed picks, with an option to avoid the last 1/3/5.
- **Settings**: light/dark/system theme, reduced motion, JSON import/export.
- **Languages**: Simplified Chinese by default, switch with **中 / EN**. Translations live in `src/lib/messages.json`.

Picks use `crypto.getRandomValues` with rejection sampling, so every eligible food has equal odds. Data is stored in the browser's localStorage (`bitepick.v2`) and does not sync across devices.

## Project structure

```text
src/app/          Page, layout, styles
src/components/   UI (picker, wheel, menu, history, settings)
src/hooks/        Persistence and theme
src/lib/          Defaults, i18n, random selection, storage
tests/            Vitest unit and DOM tests
```

## Deploy

Import into Vercel with the Next.js preset and Node.js 24. No environment variables needed.
