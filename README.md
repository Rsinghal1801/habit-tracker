# Habits · Installable Habit Tracker (PWA)

A calm, offline-first habit tracker that you can **install to your home screen** and use like a native app. Check off your habits, watch your streaks grow, and read months of progress in a GitHub-style contribution heatmap. No accounts, no servers, no tracking — everything lives in your browser's `localStorage`.

Built with **vanilla JavaScript** (no framework, no build step) and a real service worker, so it loads instantly and works with no network at all.

![Habits today view](assets/screenshot-today.png)

---

## Why it exists

A habit tracker is the perfect excuse to build a *proper* Progressive Web App — the kind that passes an install prompt, runs full-screen, and opens offline. Habits is meant to feel like a shipped product, not a demo: a distinct visual identity (a dark *aubergine* canvas lit by a single **sunrise gradient**, so a completed day literally glows), streak logic that handles the awkward edge cases, and a heatmap that makes consistency something you can *see*.

## Features

- **Today ring** — a progress ring fills as you complete the day's habits, with a live "x of y done" count.
- **Streaks that are actually correct** — current streak counts back from today (or yesterday, so you don't "break" before the day is over), plus an all-time best and a trailing-30-day completion rate per habit.
- **Contribution heatmap** — sixteen weeks of history per habit, rendered as a GitHub-style grid that brightens with each completed day.
- **One-tap check-off** — a satisfying pop animation on complete; tap again to undo.
- **Add / edit habits** — a mobile-style bottom sheet with an emoji picker and a six-colour palette, so every habit has its own identity.
- **Installable** — a real `manifest.webmanifest` + maskable icons means the browser offers "Add to Home Screen"; an in-app banner nudges the install at the right moment.
- **Fully offline** — a cache-first service worker pre-caches the whole app shell (HTML, CSS, JS, fonts, icons). After the first visit it opens with the network off.
- **Sample data** — first run seeds four habits with a few months of streaky history so the heatmaps and streaks look alive immediately.
- **Accessible** — semantic markup, focus-visible rings, `aria-live` toast, and `prefers-reduced-motion` honoured.

## Tech

| Concern | Choice | Reason |
|---|---|---|
| UI | Vanilla JS + DOM | Zero build, easy to read, nothing to install |
| Offline | Service worker (cache-first) | Instant loads + true offline |
| Install | Web App Manifest + maskable icons | Real "Add to Home Screen" |
| Storage | `localStorage` (one JSON key) | Fully offline + private |
| Type | Outfit (display) · Inter (UI) | Self-hosted, no external requests |
| Icons | Generated with Pillow | Sunrise gradient + wave glyph, incl. maskable |

Fonts are bundled locally (no Google Fonts request), so the app makes **zero external network calls** — which is what lets the service worker cache everything and run completely offline.

## Project structure

```
habit-tracker/
├── index.html              # app markup + bottom sheet + install banner
├── manifest.webmanifest    # name, colours, icons, display: standalone
├── sw.js                   # service worker: cache-first app shell
├── css/
│   └── styles.css          # aubergine theme, sunrise gradient, heatmap, ring
├── js/
│   ├── store.js            # data layer: habits, toggle, streaks, heatmap, seed
│   └── app.js              # UI controller: render, sheet, pickers, install flow
├── icons/                  # 192, 512, and maskable-512 (generated)
├── vendor/                 # self-hosted Outfit + Inter (woff2)
└── assets/                 # screenshots
```

The layering is deliberate: `store.js` knows nothing about the DOM (it's pure data + date math), and `app.js` knows nothing about how data is stored. Swapping `localStorage` for a sync backend is a one-file change.

## Run it

No tooling required — but because it's a PWA with a service worker, serve it over HTTP rather than opening the file directly (service workers don't register on `file://`).

```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000
```

### Install it

Open the served URL in a supporting browser (Chrome, Edge, or Android). Either tap the in-app **Install** banner, or use the browser menu → *Install app* / *Add to Home Screen*. It will then open full-screen, offline, like a native app.

> **Tip:** to install, the page must be served over `https://` or `http://localhost`. GitHub Pages (https) works perfectly.

## How the streak math works

- **Current streak** — walk backwards from today. If today isn't done yet, start from yesterday so an in-progress day doesn't read as a break. Stop at the first missed day.
- **Best streak** — the longest run of consecutive completed days across all history.
- **Completion rate** — completed days in the trailing 30, as a percentage.

All dates are stored as `YYYY-MM-DD` strings in local time, so there are no timezone-drift surprises.

## Privacy

There is no backend. Your habit history is a single JSON object in `localStorage` under the key `habits.v1`. Clear your browser data and it's gone; nothing is ever transmitted.

## Possible extensions

- Reminders via the Notifications API
- Weekly / custom schedules (not just daily)
- Export / import the JSON
- Sync via an optional backend (swap the storage layer)

## License

MIT — see [LICENSE](LICENSE). Bundled fonts (Outfit, Inter) are licensed under the SIL Open Font License and are free to redistribute.
