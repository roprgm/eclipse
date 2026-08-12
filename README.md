# 🌒 Eclipse

**An interactive 3D solar eclipse renderer.**

Pick a spot on the map, scrub the timeline, and watch the sky darken in real time.

## What it does

- **Real sky, real math** — Sun and Moon positions, angular sizes, and solar coverage are computed with [astronomy-engine](https://github.com/cosinekitty/astronomy) for the selected observer and simulated timestamp.
- **Atmosphere & exposure** — the sky renders with atmospheric scattering and auto exposure, so totality actually *feels* dark. Switch to manual mode and dial ISO stops like a camera.
- **Map & timeline** — click anywhere to move the observer, scrub through time second by second, and watch the HUD track azimuth, altitude, coverage, and exposure. The map overlays NASA/GSFC's path of totality for the 12 August 2026 eclipse.

## Quick start

```bash
bun install && bun dev
```

The simulation covers the 12 August 2026 eclipse from 17:00 to 19:45 UTC. Positions and coverage are calculated astronomically; the atmosphere and exposure are visual simulations.

Also available: `bun run build`, `bun test`, and `bun run check` (Biome).

## How it's built

React 19 + TypeScript, rendered with [React Three Fiber](https://github.com/pmndrs/react-three-fiber) on Three.js. State lives in a single small [Zustand](https://github.com/pmndrs/zustand) store; the map is [Leaflet](https://leafletjs.com); styling is Tailwind CSS 4; tooling is Vite, Bun, and Biome.

```
src/
├── app.tsx               Layout: controls + map | 3D scene + timeline
├── store.ts              Timestamp, observer location, celestial state
├── components/
│   ├── scene/            R3F sky: bodies, atmosphere, auto exposure, HUD
│   ├── map/              Leaflet map + totality path data
│   ├── controls/         Exposure and settings panel
│   └── timeline/         Time scrubber
└── lib/                  Ephemeris, exposure math
```

## License

[MIT](LICENSE)
