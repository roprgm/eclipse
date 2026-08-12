# 🌒 Eclipse

**An open-source, observer-based 3D solar eclipse renderer built with Three.js.**

Choose a location and move through time to see an eclipse from that observer's point of view.

<img width="1195" height="626" alt="Interactive 3D solar eclipse renderer showing a map and observer-based sky view" src="https://github.com/user-attachments/assets/a882dad8-0ec5-456c-8454-00c577f772a6" />

[Demo](https://eclipse.roprgm.com)

## Features

Eclipse combines astronomical calculations with a real-time renderer. Location and time drive the scene, so the Sun and Moon move, scale, and overlap according to the observer rather than following a preset animation.

- **Observer-based geometry.** Calculates the apparent direction and angular radius of the Sun and Moon for a latitude, longitude, and time, then derives solar coverage from their projected overlap.
- **Real-time eclipse rendering.** Custom shaders render the solar and lunar discs, soft occlusion, corona, and glare from the calculated geometry.
- **Physically inspired atmosphere.** Rayleigh and Mie scattering respond to the Sun's direction and visible area, allowing the sky to darken naturally as totality approaches.
- **HDR exposure and camera controls.** The renderer meters its HDR output for automatic exposure, supports manual ISO adjustment, and models a full-frame camera with an 18–300 mm focal range.
- **Interactive observation tools.** Select an observer on the map, use the device location, scrub or play the timeline, and inspect coordinates, local or UTC time, azimuth, altitude, coverage, exposure, and frame rate in the HUD.
- **Bundled eclipse data.** The demo includes [NASA/GSFC's path of totality and center-line coordinates](https://eclipse.gsfc.nasa.gov/SEpath/SEpath2001/SE2026Aug12Tpath.html) for the 12 August 2026 eclipse, alongside a dynamic day-night terminator.

## Quick start

```bash
bun install && bun dev
```

This project requires [Bun](https://bun.sh). Open the local URL printed by Vite after the dev server starts.

## Accuracy and scope

Celestial positions, apparent disc sizes, and coverage are calculated for the selected observer and time. The atmosphere, corona, glare, and exposure are real-time visual models, not a weather prediction or an exact photographic simulation.

Also available: `bun run build`, `bun test`, and `bun run check` (Biome).

## How it's built

React 19 + TypeScript, rendered with [React Three Fiber](https://github.com/pmndrs/react-three-fiber) on Three.js. Astronomical calculations use [astronomy-engine](https://github.com/cosinekitty/astronomy). State lives in a single small [Zustand](https://github.com/pmndrs/zustand) store; the map is [Leaflet](https://leafletjs.com); styling is Tailwind CSS 4; tooling is Vite, Bun, and Biome.

```
src/
├── app.tsx               Application layout and feature composition
├── store.ts              Timestamp, observer location, celestial state
├── components/
│   ├── scene/            Bodies, atmosphere, corona, glare, exposure, HUD
│   ├── map/              Leaflet map + totality path data
│   ├── timeline/         Time scrubber
│   └── ui/               Shared interface primitives
└── lib/                  Ephemeris, coverage, camera, and exposure math
```

## License

[MIT](LICENSE)
