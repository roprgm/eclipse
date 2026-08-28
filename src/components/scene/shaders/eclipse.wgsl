import {
	atmosphereRadiance,
	solarTransmittance,
} from "./eclipse/atmosphere.wgsl";
import { coronaRadiance } from "./eclipse/corona.wgsl";
import { EclipseGeometry } from "./eclipse/geometry.wgsl";
import { glareRadiance, GLARE_RADIUS } from "./eclipse/glare.wgsl";
import { solarDiscCoverage } from "./eclipse/solar-disc.wgsl";
import { pi } from "@vgpu/wgsl-std/constants";

const REFERENCE_SOLAR_RADIUS = 0.00465;
const SOLAR_IRRADIANCE = 1.25;
const SOLAR_MEAN_RADIANCE_FACTOR = 0.8;
const SOLAR_COLOR = vec3f(1.0, 0.658375, 0.102242);
const GEOMETRY_EPSILON = 1e-8;

struct Camera {
	right: vec3f,
	aspect: f32,
	up: vec3f,
	tanHalfFov: f32,
	forward: vec3f,
}

struct Bodies {
	sunDirection: vec3f,
	sunRadius: f32,
	moonDirection: vec3f,
	moonRadius: f32,
	sunVisibility: f32,
	visibleArea: f32,
}

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform> bodies: Bodies;

fn viewDirection(uv: vec2f) -> vec3f {
	let position = vec2f(
		(uv.x * 2.0 - 1.0) * camera.aspect,
		1.0 - uv.y * 2.0,
	) * camera.tanHalfFov;
	return normalize(
		camera.forward + camera.right * position.x + camera.up * position.y,
	);
}

fn solarVertical() -> vec3f {
	var vertical = vec3f(0.0, 1.0, 0.0) -
		bodies.sunDirection * bodies.sunDirection.y;
	if (dot(vertical, vertical) < 1e-12) {
		vertical = vec3f(1.0, 0.0, 0.0);
	}
	return normalize(vertical);
}

fn solarCoordinates(
	direction: vec3f,
	horizontal: vec3f,
	vertical: vec3f,
) -> vec2f {
	let depth = dot(direction, bodies.sunDirection);
	if (depth <= 0.0) {
		return vec2f(10.0);
	}
	return vec2f(
		dot(direction, horizontal),
		dot(direction, vertical),
	) / depth;
}

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
	let direction = viewDirection(uv);
	let horizonEdge = max(fwidth(direction.y), 1e-6);
	let skyCoverage = smoothstep(-horizonEdge, horizonEdge, direction.y);
	if (bodies.sunRadius <= 0.0) {
		return vec4f(vec3f(0.0000125, 0.000025, 0.0000625) * skyCoverage, 1.0);
	}

	let vertical = solarVertical();
	let horizontal = normalize(cross(vertical, bodies.sunDirection));
	let coordinates = solarCoordinates(direction, horizontal, vertical);
	let moonCenter = solarCoordinates(
		bodies.moonDirection,
		horizontal,
		vertical,
	);
	let geometry = EclipseGeometry(
		moonCenter,
		vec3f(horizontal.y, vertical.y, bodies.sunDirection.y),
		bodies.sunRadius,
		bodies.moonRadius,
	);
	let pixelX = dpdx(coordinates);
	let pixelY = dpdy(coordinates);
	let coordinateDistance = length(coordinates);
	let coronaRadius = coordinateDistance / bodies.sunRadius;
	let coronaEdge = max(fwidth(coronaRadius), 1e-5);
	let glareHorizonWidth = max(
		fwidth(dot(geometry.horizon.xy, coordinates) + geometry.horizon.z),
		GEOMETRY_EPSILON,
	);
	let sunTransmittance = solarTransmittance(bodies.sunDirection);
	let meanSolarRadiance = SOLAR_IRRADIANCE / (
		pi * REFERENCE_SOLAR_RADIUS * REFERENCE_SOLAR_RADIUS *
		SOLAR_MEAN_RADIANCE_FACTOR
	);
	let solarRadiance = SOLAR_COLOR * meanSolarRadiance * sunTransmittance;
	var radiance = atmosphereRadiance(
		direction,
		bodies.sunDirection,
		bodies.sunVisibility,
		sunTransmittance,
	);
	if (coronaRadius < 5.5) {
		let coverage = solarDiscCoverage(
			coordinates,
			geometry,
			pixelX,
			pixelY,
		);
		radiance += coronaRadiance(
			coordinates,
			coronaRadius,
			coronaEdge,
			coverage.y,
			solarRadiance,
		);
		if (coordinateDistance < GLARE_RADIUS) {
			radiance += glareRadiance(
				coordinates,
				geometry,
				glareHorizonWidth,
				solarRadiance,
				bodies.visibleArea,
			);
		}
		radiance += solarRadiance * coverage.x;
	}
	return vec4f(radiance * skyCoverage, 1.0);
}
