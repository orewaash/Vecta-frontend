# बोली अनुपालन जांच · Bid Compliance Checker — Frontend

A React + Vite + Tailwind app, built for a tender/procurement officer, to check bidder
submissions against a tender document — requirement by requirement, with evidence and a
queue of items that need a human decision. The officer's job on the upload screen is
deliberately reduced to two steps: upload the tender document, upload the bidders' files.

## Stack

- React 19, Vite, Tailwind CSS v4
- Icons: [lucide-react](https://lucide.dev)
- No backend yet — `UploadDashboard` simulates the analysis step, and
  `src/lib/mockResult.js` generates a plausible, internally-consistent result per bidder
  so the review screen has something real to show. Both are marked `TODO` where a real
  `fetch()` call should replace the simulation.

## Structure

```
src/
  App.jsx                 -- routes between the upload screen and the review screen
  index.css                -- Tailwind import + design tokens (@theme) + global a11y styles
  components/
    UploadDashboard.jsx     -- tender + bidder upload, drag & drop, inline rename
    BidDashboard.jsx        -- three-pane review: summary, requirement list, evidence
    ScoreGauge.jsx           -- small radial compliance-score gauge
    TopBar.jsx                -- tricolour strip + official-portal header, used on every screen
    Footer.jsx                 -- plain-language disclaimer footer
  lib/
    mockResult.js            -- deterministic per-bidder mock data (temporary)
```

## Running locally

```
npm install
npm run dev
```

## Designed for a government procurement officer

- **Two-step upload, not a form**: Step 1 is the tender document, Step 2 is the bidders'
  files (any number, chosen at once or added one at a time). Each step shows a numbered,
  turns-green-when-done indicator so it's obvious what's left before the check button
  becomes active.
- **Bilingual labels**: every instruction and button carries both Hindi and English —
  standard practice on Indian government portals and something a mixed-fluency office can
  rely on without a language toggle to find first.
- **Official portal identity, without using the protected State Emblem**: a thin
  saffron/white/green strip and a navy header bar, the same visual language as GeM and
  other e-governance portals, using a generic building icon rather than the Emblem of
  India (use of which is restricted under the Emblems and Names Act).
- **A human stays in the loop**: the footer states plainly that this tool assists review
  and the officer makes the final call — nothing here auto-rejects a bid.
- **Large, unambiguous controls**: explicit "Choose file" buttons (not drag-and-drop-only),
  bigger touch targets, and a single obvious green "Check bids" button rather than a
  generic form submit.

## What changed in this pass

- **Design system**: replaced the default Tailwind gray/indigo palette with a small set of
  tokens defined in `src/index.css` (`@theme`) — a warm neutral scale plus a teal/brass brand
  pair and one consistent set of compliant/failed/needs-review colors used everywhere a verdict
  appears, instead of ad-hoc `green-100`/`red-100` classes scattered per component.
- **Typography**: IBM Plex Sans for UI text and IBM Plex Mono for requirement IDs and codes,
  loaded once in `index.html`.
- **Bidder switching**: the review screen now lets you switch between all uploaded bidders
  instead of only ever showing the first one; each gets its own generated result.
- **Navigation**: added a way back from the review screen to start a new upload, which the
  original screen didn't have.
- **Mobile**: the three-pane review layout collapses into a tabbed single-pane view below the
  `md` breakpoint instead of squeezing three fixed-width panes onto a phone screen.
- **Accessibility**: real `<button>` elements (not `<div onClick>`) for every interactive row,
  visible focus rings, `aria-label`/`aria-selected` on the controls that needed them, and
  `prefers-reduced-motion` respected globally.
- **Cleanup**: removed the leftover default Vite/React template markup and CSS (`App.css`,
  the hero/next-steps sections) that had no path to the current app.
