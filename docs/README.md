# The Engineer's Archipelago — Documentation

These docs are written **as a teacher**, not as a reference manual. The goal is
that you (Suvrt) can read them top-to-bottom and come away understanding *why*
each piece exists and *what alternative we rejected and why* — so the codebase
becomes a thing you can reason about, extend, and eventually sell as a template.

## How to read this

Read in order the first time. Each doc builds on the last.

| # | Doc | What you'll learn |
|---|-----|-------------------|
| 1 | [Overview](./01-overview.md) | The product goal (two audiences), the tech stack, and the one-sentence reason for each tool. |
| 2 | [Architecture](./02-architecture.md) | How the code is layered, the SOLID "seams," and how a request becomes a page. Diagrams included. |
| 3 | [Decision log](./03-decisions.md) | Every significant choice as **"we used X instead of Y because Z."** This is the one to study. |
| 4 | [Theming guide](./04-theming.md) | How the theme system works and a step-by-step "add a new theme" walkthrough (the sellable-template angle). |
| 5 | [Content guide](./05-content-guide.md) | Where your real data lives and how to edit it without touching components. |
| 6 | [Rendering: 2D vs React Three Fiber](./06-rendering-2d-vs-3d.md) | The deep dive on the map. Why we're starting 2D, the trade-offs, and when 3D would actually be worth it. |

## The 30-second summary

- **What it is:** a portfolio that serves *recruiters* (skim the résumé in 60s at `/`)
  and *the curious* (explore an interactive island map at `/archipelago`, coming in Phase 2).
- **What's special:** the visual "pirate" theme is completely separated from the
  content and the engine, so the whole thing can be re-skinned — or sold as a
  template — by editing data and tokens, never components.
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
  shadcn/ui (on Base UI) · Motion (Framer Motion).

## Current status

- ✅ **Phase 1** — landing page (`/`): hero, Captain's Log, skills, projects, Harbor contact.
- ✅ **Phase 2** — interactive map (`/archipelago`): the world-map engine + a
  **three-tier renderer seam** (`dom` and `canvas` both live and switchable;
  `three` registered as *planned*), island selection, detail panels, pan/zoom.
  See [doc 6](./06-rendering-2d-vs-3d.md).
- ✅ **Phase 3** — long-form **MDX** stories at `/projects/[slug]` (statically
  generated, themed prose), content enriched from real history. See the
  [content guide](./05-content-guide.md#long-form-stories-mdx).
- ✅ **Phase 4** — SEO (`sitemap.xml`, `robots.txt`, dynamic OG image, JSON-LD
  Person/WebSite), themed 404, map entrance animation + sea decor. Site is fully
  static, minimal JS, self-hosted fonts.
- ⬜ Phase 5 — template extraction (de-brand, config-drive, package for sale).

> **Before deploying:** set your real domain in [`src/config/site.ts`](../src/config/site.ts)
> (`url`) — the sitemap, OG tags, and canonical URLs derive from it (currently
> `https://example.com`).

> **Note on diagrams:** these files use [Mermaid](https://mermaid.js.org/) code
> blocks. GitHub, VS Code (with the Markdown Preview Mermaid extension), and most
> Markdown viewers render them as diagrams automatically.
