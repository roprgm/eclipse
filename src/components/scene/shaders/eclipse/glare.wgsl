import { distanceToVisibleSun, EclipseGeometry } from "./geometry.wgsl";
import { pi } from "@vgpu/wgsl-std/constants";

export const GLARE_RADIUS = 0.008;
const GLARE_SOFTENING = 0.00008;
const GLARE_SCATTER = 1.5e-4;

export fn glareRadiance(
	coordinates: vec2f,
	geometry: EclipseGeometry,
	horizonWidth: f32,
	solarRadiance: vec3f,
	visibleArea: f32,
) -> vec3f {
	let distanceToSource = distanceToVisibleSun(coordinates, geometry);
	let sourceScale = min(
		1.0,
		visibleArea / (pi * GLARE_SOFTENING * GLARE_SOFTENING),
	);
	let inverseRadius = GLARE_SOFTENING /
		(distanceToSource + GLARE_SOFTENING);
	let glare = GLARE_SCATTER * sourceScale * inverseRadius * inverseRadius;
	let cutoff = 1.0 - smoothstep(0.006, GLARE_RADIUS, length(coordinates));
	let horizonDistance =
		dot(geometry.horizon.xy, coordinates) + geometry.horizon.z;
	let horizonCoverage = smoothstep(
		-horizonWidth,
		horizonWidth,
		horizonDistance,
	);
	return solarRadiance * glare * cutoff * horizonCoverage;
}
