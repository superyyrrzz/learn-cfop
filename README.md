# Learn CFOP

Interactive web app for learning the CFOP (Fridrich) method — the most popular speedcubing technique for solving the Rubik's Cube. Covers all four steps: **Cross**, **F2L**, **OLL**, and **PLL**.

## Features

- **3D Cube Viewer** — Three.js-powered interactive cube with orbit controls
- **Algorithm Playback** — Play, pause, step through, and adjust speed for each algorithm
- **Step Breakdowns** — Per-move labels explaining what each notation does
- **Progress Tracking** — Mark algorithms as learned; progress persists in localStorage
- **Beginner / Full Tiers** — Filter to essential algorithms or see the complete set
- **Mobile Responsive** — Works on phones, tablets, and desktops

## Tech Stack

- Vanilla JS (ES6 modules, no bundler)
- [Three.js](https://threejs.org/) v0.160.0 via CDN
- CSS custom properties for theming
- Deployed on [Cloudflare Pages](https://pages.cloudflare.com/)

## Run Locally

This is a static site — no build step needed. Just serve the files:

```bash
# any local server works, e.g.
npx http-server -p 8000
```

Then open `http://localhost:8000`.

## Project Structure

```
├── index.html          Landing page
├── cross/f2l/oll/pll.html   Step tutorial pages
├── css/                Modular stylesheets (variables, layout, components, responsive)
├── js/
│   ├── app.js          Entry point
│   ├── cube/           3D cube model, renderer, animator, move parser
│   └── ui/             Algorithm cards, player controls, progress tracker
└── data/               Algorithm definitions (JSON)
```
