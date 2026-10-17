// PostCSS config for Tailwind CSS 4 (Tailwind is the styling layer, `@import 'tailwindcss';` goes into the global
// stylesheet). Both bundlers read it: Turbopack in `next dev`, webpack in `next build --webpack` (see AGENTS.md).
//
// Derived from: `02-project-config/postcss.config.mjs` of the guardrails kit. Needs `@tailwindcss/postcss` and
// `tailwindcss`.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
