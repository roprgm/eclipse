import {
	type CelestialBodyState,
	calculateSolarCoverage,
} from "@/lib/celestial-bodies";
import { type SelectedPoint, useStore } from "@/store";

const RADIANS_TO_DEGREES = 180 / Math.PI;

function formatTimestamp(timestamp: number) {
	return new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");
}

function formatBody(body: CelestialBodyState | null) {
	if (!body) return "—";
	return `AZ ${(body.azimuthRad * RADIANS_TO_DEGREES).toFixed(1)}° ALT ${(body.altitudeRad * RADIANS_TO_DEGREES).toFixed(1)}°`;
}

function formatLocation(point: SelectedPoint | null) {
	if (!point) return "—";
	return `${point.latitude.toFixed(3)}°, ${point.longitude.toFixed(3)}°`;
}

function formatCoverage(
	sun: CelestialBodyState | null,
	moon: CelestialBodyState | null,
) {
	if (!sun || !moon) return "—";
	return `${(calculateSolarCoverage(sun, moon) * 100).toFixed(1)}%`;
}

export function SceneHud() {
	const timestamp = useStore((state) => state.timestamp);
	const selectedPoint = useStore((state) => state.selectedPoint);
	const sun = useStore((state) => state.sun);
	const moon = useStore((state) => state.moon);
	const location = formatLocation(selectedPoint);
	const coverage = formatCoverage(sun, moon);

	return (
		<header className="pointer-events-none absolute top-6 right-7 left-7 grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-sm tracking-wide @max-[720px]:grid-cols-1">
			<div className="grid content-start gap-1">
				<p>
					<span className="text-muted">LOC </span>
					{location}
				</p>
				<time>
					<span className="text-muted">UTC </span>
					{formatTimestamp(timestamp)}
				</time>
			</div>
			<div className="grid content-start justify-items-end gap-1 text-right @max-[720px]:justify-items-start @max-[720px]:text-left">
				<p>
					<span className="text-muted">SUN </span>
					{formatBody(sun)}
				</p>
				<p>
					<span className="text-muted">MOON </span>
					{formatBody(moon)}
				</p>
				<p>
					<span className="text-muted">COVER </span>
					{coverage}
				</p>
			</div>
		</header>
	);
}
