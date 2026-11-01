# 3. Decision Log

This is the doc to study. Each entry is a real choice we made, written as
**X instead of Y, because Z**, with the trade-off we accepted. The format is a
lightweight ADR (Architecture Decision Record). When you read the code and think
"why is it like this?", the answer should be here.

Every decision traces back to the [six qualities](./01-overview.md#the-non-negotiable-qualities):
mobile-first, fast, SEO, accessible, themeable, sellable.

---

### ADR-01 — Next.js (App Router) instead of a Vite SPA

**Context.** A portfolio could be a plain single-page app (Vite + React).

**Decision.** Use Next.js with the App Router.

**Why not the SPA.** A pure SPA ships a blank `<div>` and a JS bundle; the
content only appears after JavaScript runs. That hurts **SEO** (crawlers and
link-preview bots see little) and **FCP** (nothing paints until JS executes).
Next.js renders real HTML on the server, so the page arrives complete.

**Trade-off.** More framework concepts to learn (server vs client components,
the App Router). Worth it: it also gives us a clean path if this becomes a SaaS.

---

### ADR-02 — Next.js 16 instead of the Next.js 15 in the original plan

**Context.** The plan said Next 15. `create-next-app@latest` installed **16**.

**Decision.** Keep 16.

**Why.** It's the current, supported major; React 19 and Tailwind v4 are
first-class; nothing in our design needs 15 specifically. The plan was explicitly
flexible.

**Trade-off.** Some training data and blog posts still describe 15. The bundled
docs in `node_modules/next/dist/docs/` are the source of truth (the project's
`AGENTS.md` even reminds you of this).

---

### ADR-03 — Tailwind v4 instead of CSS Modules or styled-components

**Context.** We need a styling system that also powers multi-theme support.

**Decision.** Tailwind v4 with a semantic-token layer.

**Why not the alternatives.** CSS Modules scatter colours across dozens of files,
which makes theming a find-and-replace nightmare. styled-components is
**runtime** CSS-in-JS (a JS cost on every render, and awkward with Server
Components). Tailwind v4 compiles to static CSS and its `@theme` token system maps
*perfectly* onto per-theme CSS variables — exactly the seam we want (see
[ADR-09](#adr-09--theme-tokens-by-css-class-instead-of-compiled-stylesheets-or-theme-in-js)).

**Trade-off.** Long `className` strings. We tame them with `cn()` and small
reusable components (`Section`, `Surfaces`).

---

### ADR-04 — shadcn/ui (own the code) instead of a component-library dependency

**Context.** We need buttons, sheets, dialogs, tooltips.

**Decision.** Use shadcn/ui, which **copies component source into our repo**
(`src/components/ui/`) rather than installing a black-box package.

**Why not MUI / Chakra / Ant.** Those are dependencies you theme *around*, fighting
their defaults, shipping their runtime. Because shadcn components live in our
codebase, we can restyle them with our tokens and **ship them inside a sellable
template**. Ownership is the point.

**Trade-off.** You're responsible for updating the copied components. Acceptable
— they change slowly and we *want* control.

---

### ADR-05 — shadcn on Base UI instead of Radix UI

**Context.** shadcn historically generated Radix-based components.

**Decision.** We use whatever the latest shadcn ships — the `base-nova` style,
built on **Base UI** (`@base-ui/react`).

**Why.** Base UI is the successor to Radix from the same team. It's what `shadcn
init` produced; swimming against it would mean rewriting every primitive.

**Trade-off.** Base UI's API differs from Radix in places (e.g. composition uses a
`render={<Component/>}` prop instead of `asChild`). You'll see `render={<Link/>}`
in `SiteHeader` for exactly this reason.

---

### ADR-06 — Motion (Framer Motion) instead of CSS-only or GSAP

**Context.** We want tasteful entrance animations.

**Decision.** Use Motion for scroll reveals, with a hard rule: **respect
`prefers-reduced-motion`** (see `components/common/reveal.tsx`).

**Why not the others.** Pure CSS scroll-reveal is fiddly across browsers; GSAP is
powerful but heavier and not React-idiomatic. Motion is declarative and ships
`useReducedMotion()`, so accessibility is one line, not an afterthought.

**Trade-off.** It's client-side JS. So we use it *only* for non-critical, below-
the-fold flourishes — never for content that must be visible immediately (see
[ADR-10](#adr-10--static-hero-instead-of-animating-the-lcp-element)).

---

### ADR-07 — Typed config for content instead of MDX / Contentlayer

**Context.** The original plan suggested MDX files for projects/islands.

**Decision.** Store islands, projects, skills, log, and bugs as **typed
TypeScript** in `src/content/`. Reserve MDX for long-form prose later (Phase 3).

**Why not MDX-for-everything.** Your island/project data is *structured* (a title,
a position, a list of tech). Structured data wants a schema, not prose. And the
SaaS dream — "users create islands without code" — is a *form writing JSON*, not a
user authoring MDX. Typed config is the honest representation and gives us
compile-time safety (rename a field, the compiler finds every use).

**Trade-off.** Editing content means editing `.ts` files (with quotes and commas)
rather than freeform Markdown. For a developer's portfolio that's fine, and it's
exactly the shape a future CMS would feed.

---

### ADR-08 — A data-provider interface instead of importing content directly

**Context.** Components could just `import { projects } from "@/content"`.

**Decision.** They go through `getDataProvider()`, which returns an
`IWorldDataProvider`. (See [Architecture › Seam 1](./02-architecture.md#seam-1--content-sits-behind-an-interface-dependency-inversion).)

**Why.** This is the single line you change to move from hardcoded data → a CMS or
SaaS API. If components imported `content/` directly, that migration would touch
every component. The interface is cheap insurance for a future that's central to
this project's monetization plan.

**Trade-off.** A tiny bit of indirection today for a lot of flexibility later.

---

### ADR-09 — Theme tokens by CSS class instead of compiled stylesheets or theme-in-JS

**Context.** We need to re-skin the entire site, ideally for a template buyer.

**Decision.** Each theme is a block of CSS-variable values under a class
(`.theme-pirate { --primary: …; --background: …; }`) in `globals.css`. The active
theme's class goes on `<html>`. Components only ever reference the *semantic*
token (`bg-primary`), never a literal colour.

**Why not the alternatives.** Compiling a separate stylesheet per theme bloats the
payload and complicates the build. Theme-in-JS (passing a colours object through
React context and styling inline) defeats Tailwind and adds runtime work. CSS
variables are free at runtime, switch instantly, and require **zero** component
changes to add a theme.

**Trade-off.** You must be disciplined: never hardcode a hex value in a component.
Always add/extend a token. (The brand utilities like `bg-gold` are tokens too.)

---

### ADR-10 — Static hero instead of animating the LCP element

**Context.** Early on, the hero text was wrapped in a scroll-reveal animation.

**Decision.** Render the hero's headline, tagline, and CTAs **statically** (no JS
gate). Keep the reveal only on the decorative parchment card.

**Why.** The hero headline is almost certainly the **Largest Contentful Paint**
element. A scroll-reveal renders it at `opacity: 0` until JavaScript hydrates and
an observer fires — which *delays LCP* and leaves the hero blank for no-JS users.
Critical, above-the-fold content must never depend on JS to be visible.

**Trade-off.** The hero doesn't "animate in." That's the correct trade: a fast,
always-visible hero beats a flashy-but-late one.

---

### ADR-11 — An icon registry with string keys instead of importing icons in content

**Context.** Content needs to reference icons (a skill group's glyph, a node's icon).

**Decision.** Content stores a **string** (`iconKey: "drone"`). One file,
`lib/icons.tsx`, maps strings → icon components.

**Why.** If `content/` imported icon components, it would be coupled to a React
icon library and could never come from a database (you can't store a React
component in a JSON row, but you *can* store `"drone"`). The registry also means
swapping the entire icon set is a one-file change.

**Trade-off.** An unknown key needs a sensible fallback — we render a neutral
circle so bad data never crashes the page.

---

### ADR-12 — Inline SVG brand icons instead of a brand-icon dependency

**Context.** This `lucide-react` build dropped brand icons (GitHub, LinkedIn) for
trademark reasons.

**Decision.** Inline the two brand glyphs as small SVG components in
`lib/icons.tsx`.

**Why.** Adding a whole second icon dependency for two glyphs isn't worth the
weight. Inlining keeps the bundle lean and the registry self-contained.

**Trade-off.** Those two paths are hand-maintained. They almost never change.

---

### ADR-13 — Normalized 0–100 map coordinates instead of pixel coordinates

**Context.** Each island needs a position on the map (`world.ts`).

**Decision.** Store positions as `{ x: 0–100, y: 0–100 }` — percentages, not pixels.

**Why.** The map must work on a 375px phone and a 1440px desktop. Percentages are
resolution-independent, so the renderer can place a node with `left: 30%` and it's
correct everywhere. Crucially, this is also **renderer-agnostic**: a future 3D
renderer can map the same 0–100 space into world units. (This is the seam that
keeps the 2D-vs-3D door open — see [doc 6](./06-rendering-2d-vs-3d.md).)

**Trade-off.** None meaningful. It's strictly more flexible than pixels.

---

### ADR-14 — Self-hosted fonts via `next/font` instead of `<link>` to Google Fonts

**Context.** The theme uses Cinzel (display), Geist (body), and Pinyon Script
(the signature).

**Decision.** Load them with `next/font/google` in `layout.tsx`.

**Why.** `next/font` downloads and self-hosts the fonts at build time, so there's
no third-party request, no extra DNS lookup, and **no layout shift** (it reserves
space). A raw `<link>` to fonts.googleapis.com is slower and can cause flashes.

**Trade-off.** Each extra family adds payload, so we keep it to three and use a
single weight for the decorative script font.

---

### Environment footnote — the Windows PATH quirk

Node was installed mid-session via `winget`, which updated the machine PATH but
**not** already-running shells. So tooling here prepends
`C:\Program Files\nodejs` to PATH, and the dev server runs through a small
`.claude/dev.cmd` wrapper that does the same. Not an architecture decision — just
a thing that will confuse you if you don't know it. (Also recorded in project
memory.)

---

### ADR-15 — Blog posts as typed metadata + MDX, behind the data provider

**Context.** The site needs a blog for technical writing, which is long-form
prose — exactly what ADR-07 reserved MDX for.

**Decision.** Mirror the project-story pattern: a `Post` type and metadata in
`content/posts.ts`, prose in `content/posts/<slug>.mdx`, and an explicit loader
registry. Pages read posts only through `getDataProvider().getPosts()`. Drafts
are filtered out in production by the provider.

**Why not frontmatter + a filesystem scan.** Reading the folder at build time
would mean computed import paths (unfriendly to Turbopack) and untyped
frontmatter. The registry keeps every import static, and the metadata gets the
same compile-time checking as everything else in `content/`. Putting draft
filtering in the provider keeps the rule in one place — routes, sitemap, and
the index page all inherit it.

**Trade-off.** Publishing a post touches three files (MDX, registry, metadata)
instead of one. Acceptable for a handful of posts a month; a CMS provider could
replace it later without touching the pages.
