# 🌒 Eclipse

**A Three.js interactive 3D solar eclipse renderer.**

Pick a spot on the map, scrub the timeline, and watch the sky darken in real time.

<img width="600" height="315" alt="og-image" src="https://github.com/user-attachments/assets/1438bd72-b36b-4a95-8a0e-b3e7efe0a6c0" />

## Features

Eclipse combines astronomical calculations with a real-time renderer. The selected location and simulated time drive the scene, so the Sun and Moon move, scale, and overlap according to the observer rather than following a preset animation.

- **Observer-based eclipse geometry.** The app calculates the apparent position and angular radius of the Sun and Moon for the selected latitude, longitude, and time. Their calculated overlap determines the solar coverage.
- **A rendering response to totality.** The calculated discs and coverage drive the atmosphere, solar glare, corona, and exposure. As the Moon blocks the Sun, the scene loses daylight and adapts its exposure instead of simply fading to black.
- **Automatic or manual exposure.** Auto exposure meters the rendered scene and adjusts in ISO stops. Manual mode keeps the same controls available when a fixed exposure is useful.
- **Map, timeline, and live data.** Click the map to set an observation point, then scrub or play the timeline with second-level precision. The HUD shows the observer coordinates, UTC time, azimuth, altitude, coverage, and exposure. The map also includes NASA/GSFC's path of totality for the eclipse.

## Quick start

```bash
bun install && bun dev
```

This project requires [Bun](https://bun.sh). Open the local URL printed by Vite after the dev server starts.

## Simulation scope

The simulation covers the 12 August 2026 eclipse from 17:00 to 19:45 UTC. Celestial positions, apparent disc sizes, and coverage are calculated for the selected observer. The atmosphere and exposure are real-time visual models, not a prediction of weather or an exact photograph of the event.

Also available: `bun run build`, `bun test`, and `bun run check` (Biome).

## How it's built

React 19 + TypeScript, rendered with [React Three Fiber](https://github.com/pmndrs/react-three-fiber) on Three.js. Astronomical calculations use [astronomy-engine](https://github.com/cosinekitty/astronomy). State lives in a single small [Zustand](https://github.com/pmndrs/zustand) store; the map is [Leaflet](https://leafletjs.com); styling is Tailwind CSS 4; tooling is Vite, Bun, and Biome.

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
