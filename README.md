# Personal Portfolio Foundation

This project is a one-page portfolio scaffold built with Astro and React. Content lives in Astro collections so the frontend stays focused on presentation while the portfolio data remains easy to update.

## Stack

- Astro for the app shell, static generation, and content collections
- React for the scrollable single-page experience and navigation state

## Project structure

- `src/components/PortfolioPage.tsx` renders the portfolio UI
- `src/content.config.ts` defines the portfolio collections
- `src/data/` stores seeded collection data for `about`, `projects`, `experience`, `resume`, and `contact`
- `src/styles/theme.css` is the single place to change fonts, color tokens, light mode, and dark mode theme values
- `src/pages/api/portfolio.json.ts` exposes the public portfolio content as a prerendered static JSON file

## Getting started

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Run `npm run dev`.

## Static deployment

This project now builds as a static Astro site, so you can deploy the generated `dist/` output to hosts like Cloudflare Pages, Netlify, GitHub Pages, or any static file server.

1. Run `npm run build`.
2. Upload or deploy the generated `dist/` directory.
3. If your host asks for settings, use `npm run build` as the build command and `dist` as the output directory.

## Notes

- Replace the seeded content in `src/data/` with your actual portfolio details.
- Theme preference is cached in `localStorage` under `portfolio-theme`, and the site restores that choice on reload.
- The contact section now renders directly on the page, and the resume section points visitors to reach out for the full resume instead of downloading it from a server route.
