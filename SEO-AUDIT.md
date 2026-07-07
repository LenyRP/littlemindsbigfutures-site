# SEO Audit & Improvement Plan — Little Minds, Big Futures

**Date:** 2026-07-07
**Site:** https://littlemindsbigfutures.com (Cloudflare Worker, static HTML)
**Business:** Faith-based early-childhood tutoring, ages 3–8, Williamson County, TN (Leslie Dykstra)
**SEO goal:** Local lead-gen — booked free consultations
**Scope:** On-page + technical + content audit from source (no Search Console access in this environment)

---

## Executive summary

The site is **fundamentally healthy**: clean `robots.txt`, a current XML sitemap (58 URLs), self-referencing extensionless canonicals, full HTTPS, sensible cache headers, responsive/mobile-first markup, near-universal image alt text, and genuinely rich Schema.org markup on the money pages (LocalBusiness, Service, FAQPage, Review, AggregateRating). A 43-post blog gives strong topical depth for early literacy and kindergarten readiness.

The problems are **concentrated and cheap to fix**:

1. **Meta descriptions are too long on every money page** (196–246 chars) → truncated in search, weaker click-through.
2. **Homepage `<h1>` is brand-only** ("Little Minds, Big Futures") → no primary keyword in the single most important heading.
3. **Homepage and the Kindergarten-Readiness page share a near-identical title** → keyword cannibalization on "kindergarten readiness tutor Williamson County."
4. **Schema gaps:** location pages, the two preschool/early-elementary service pages, and the checklist landing page lack `FAQPage`; the checklist page has **no schema at all**.
5. **Geo intent gap:** only 3 location pages exist. **Arrington (the HQ!), College Grove, and Chapel Hill** — all named in the footer service area — have no dedicated page.
6. **Thin, high-intent blog posts:** several money-adjacent posts (e.g. `choosing-a-reading-tutor-williamson-county`, `how-to-teach-a-child-to-read`, `what-order-to-teach-phonics`) are under 700 words and missing FAQ schema.
7. **Weak internal linking from money pages into the blog** — most service/money pages only link to the blog via the footer, so the blog's topical authority isn't flowing to the pages that convert.

---

## Technical SEO — findings

| Item | Status | Notes |
|---|---|---|
| robots.txt | ✅ Pass | Allow all + sitemap reference |
| XML sitemap | ✅ Pass | 58 URLs, extensionless, `lastmod` current |
| Canonicals | ✅ Pass | Self-referencing, extensionless, consistent |
| HTTPS | ✅ Pass | Valid cert, live on apex domain |
| Cache headers | ✅ Pass | 1-day + SWR on assets/css/pdf |
| Mobile | ✅ Pass | viewport set, responsive, sticky call bar |
| Image alt | ⚠️ Minor | `about.html` has 1 empty `alt=""`; otherwise good |
| New blog hero dimensions | ⚠️ Minor | 4 new heroes are 1376×768 but tagged `width="2048" height="1152"` (aspect ratio matches, so no CLS; attrs inaccurate) |
| Schema coverage | ⚠️ Gaps | See on-page section |

**Verdict:** No crawlability or indexation blockers. Technical foundation is solid.

---

## On-page SEO — findings & actions

### Titles
| Page | Len | Action |
|---|---|---|
| `programs.html` | 103 | **Trim** — drop duplicate geo/brand; ~60 chars |
| `locations/brentwood.html` | 102 | **Trim** |
| `locations/nolensville.html` | 102 | **Trim** |
| `index.html` vs `kindergarten-readiness.html` | 81 / 81 | **De-cannibalize** — homepage → broader "early childhood & reading tutor"; readiness page keeps "kindergarten readiness tutor" |
| Blog titles (most flagged "long") | 73–107 | Mostly the intentional ` \| Little Minds, Big Futures` suffix — **low priority**, leave unless core phrase itself is >60 |

### Meta descriptions (trim all to ≤160, keep primary keyword + geo)
`index` (196), `about` (216), `programs` (227), `pricing` (235), `contact` (246), `kindergarten-readiness-checklist` (233), plus location pages (176–182, borderline). Worst blog offenders: `is-it-too-late` (267), `early-math-skills-before-kindergarten` (231), `how-to-read-aloud` (231), `what-order-to-teach-phonics` (210).

### Headings
- **Homepage H1** → add primary keyword. Keep the signature brand hero visually; add a keyword-bearing line inside the `<h1>` (with a small CSS rule).
- All other pages: one H1, keyworded, logical hierarchy. ✅

### Schema gaps to close
- `kindergarten-readiness-checklist.html` — add `WebPage` + `FAQPage`.
- `locations/*` (all 3) — add `FAQPage` (they have LocalBusiness + City).
- `preschool-tutoring.html`, `early-elementary-tutoring.html` — add a short FAQ + `FAQPage` (kindergarten-readiness already has it).

---

## Content — findings & actions

### Thin content
- **Location pages** (412–426 words) — expand with neighborhood detail, drive context, an FAQ, and interlinks.
- **Checklist landing** (354 words) — conversion page, acceptable length; add schema + a couple of trust lines.
- **High-intent thin blog posts to expand (≥900 words + FAQ schema):**
  `choosing-a-reading-tutor-williamson-county` (561, local money post), `how-to-teach-a-child-to-read` (609), `what-order-to-teach-phonics` (no FAQ), `is-it-too-late-for-my-child-to-learn-to-read`, `signs-your-child-is-struggling-to-read`. (Secondary: `how-to-read-aloud`, `prevent-summer-learning-loss`, `early-math-skills-before-kindergarten`.)

### Keyword / search-intent gaps
- **Geo:** create location pages for **Arrington, College Grove, Chapel Hill** (named in footer, no page). Arrington is the HQ and appears in titles site-wide — it should own its local page.
- **Service coverage** (preschool / kindergarten readiness / early elementary / consulting) is already strong.

### Cannibalization
- Homepage vs `kindergarten-readiness.html` both target "kindergarten readiness tutor Williamson County" → differentiate titles/H1 (above).
- Kindergarten blog posts are informational (question intent) vs the transactional service page — acceptable, no change needed beyond clear internal linking.

---

## Internal linking — plan
- Add **contextual in-content links** from each money/service page to 2–4 relevant blog posts (currently mostly footer-only).
- Link the **4 new posts** from the right service pages (e.g. Alphabet Bingo & "books at every age" → kindergarten-readiness & preschool; serve-and-return → preschool; favorite-toy → programs).
- Interlink the **new location pages** with services, blog, and the other location pages.

---

## Prioritized action plan

**P1 — On-page quick wins (highest ROI, low risk)**
1. Trim all money-page meta descriptions to ≤160 chars.
2. De-cannibalize homepage vs kindergarten-readiness titles.
3. Trim over-long titles (programs, brentwood, nolensville).
4. Add keyword to homepage H1 (+ small CSS).
5. Add `FAQPage` schema to 3 location pages, preschool, early-elementary; add `WebPage`+`FAQPage` to checklist.

**P2 — Content depth & geo coverage**
6. Create 3 new location pages (Arrington, College Grove, Chapel Hill) + sitemap + footer/nav links.
7. Expand 5 high-intent thin blog posts (content + FAQ schema); trim their meta descriptions.

**P3 — Internal linking**
8. Add contextual money-page → blog links; wire the 4 new posts into services; interlink locations.

**Later / monitoring (not code changes)**
- Connect Google Search Console + Bing Webmaster; submit sitemap.
- Add real Google Business Profile reviews as they come in.
- Regenerate the 4 new blog heroes at 2K (or correct the width/height attrs) — cosmetic.

---

*Implementation status tracked in the commit that accompanies this file.*
