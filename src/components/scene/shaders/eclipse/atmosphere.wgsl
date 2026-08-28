import { pi } from "@vgpu/wgsl-std/constants";

const RAYLEIGH_HEIGHT = 8000.0;
const MIE_HEIGHT = 1200.0;
const RAYLEIGH_SCATTERING = vec3f(5.802e-6, 13.558e-6, 33.1e-6);
const MIE_EXTINCTION = vec3f(4.44e-6);
const MIE_SCATTERING = vec3f(3.996e-6);
const MIE_G = 0.8;

fn airMass(cosineZenith: f32) -> f32 {
	let angleDegrees = degrees(acos(clamp(cosineZenith, 0.0, 1.0)));
	return 1.0 / (
		max(cosineZenith, 0.0) +
		0.15 * pow(93.885 - angleDegrees, -1.253)
	);
}

fn rayleighPhase(cosineTheta: f32) -> f32 {
	return 3.0 * (1.0 + cosineTheta * cosineTheta) / (16.0 * pi);
}

fn miePhase(cosineTheta: f32) -> f32 {
	let gSquared = MIE_G * MIE_G;
	let scale = 3.0 * (1.0 - gSquared) / (8.0 * pi * (2.0 + gSquared));
	return scale * (1.0 + cosineTheta * cosineTheta) /
		pow(max(1.0 + gSquared - 2.0 * MIE_G * cosineTheta, 0.0001), 1.5);
}

export fn solarTransmittance(sunDirection: vec3f) -> vec3f {
	let extinction =
		RAYLEIGH_SCATTERING * RAYLEIGH_HEIGHT +
		MIE_EXTINCTION * MIE_HEIGHT;
	return exp(-extinction * airMass(sunDirection.y));
}

export fn atmosphereRadiance(
	direction: vec3f,
	sunDirection: vec3f,
	sunVisibility: f32,
	sunTransmittance: vec3f,
) -> vec3f {
	let viewAirMass = airMass(direction.y);
	let viewRayleighDepth =
		RAYLEIGH_SCATTERING * RAYLEIGH_HEIGHT * viewAirMass;
	let viewMieDepth = MIE_EXTINCTION * MIE_HEIGHT * viewAirMass;
	let extinctionDepth = viewRayleighDepth + viewMieDepth;
	let cosineTheta = dot(direction, sunDirection);
	let scatteringDepth =
		viewRayleighDepth * rayleighPhase(cosineTheta) +
		MIE_SCATTERING * MIE_HEIGHT * viewAirMass * miePhase(cosineTheta);
	let scattering =
		(1.0 - exp(-extinctionDepth)) *
		scatteringDepth /
		max(extinctionDepth, vec3f(1e-6));
	let daylight = smoothstep(-0.1, 0.02, sunDirection.y);
	let nightSky = vec3f(0.0000125, 0.000025, 0.0000625);
	return nightSky +
		daylight * sunVisibility * sunTransmittance * scattering * 1.25;
}
