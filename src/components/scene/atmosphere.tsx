import type { LocalDirection } from "@/lib/celestial-bodies";
import * as THREE from "three";
import { toThreeDirection } from "./three-directions";

const VERTEX_SHADER = /* glsl */ `
	varying vec3 vWorldPosition;

	void main() {
		vec4 worldPosition = modelMatrix * vec4(position, 1.0);
		vWorldPosition = worldPosition.xyz;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		gl_Position.z = gl_Position.w;
	}
`;

const FRAGMENT_SHADER = /* glsl */ `
	varying vec3 vWorldPosition;

	uniform vec3 uSunDirection;
	uniform float uSunVisibility;

	const float PI = 3.141592653589793;
	const float RAYLEIGH_HEIGHT = 8000.0;
	const float MIE_HEIGHT = 1200.0;
	const vec3 RAYLEIGH_SCATTERING = vec3(5.802e-6, 13.558e-6, 33.1e-6);
	const vec3 MIE_EXTINCTION = vec3(4.44e-6);
	const vec3 MIE_SCATTERING = vec3(3.996e-6);
	const float MIE_G = 0.8;

	float airMass(float cosineZenith) {
		float angleDegrees = degrees(acos(clamp(cosineZenith, 0.0, 1.0)));
		return 1.0 / (
			max(cosineZenith, 0.0) +
			0.15 * pow(93.885 - angleDegrees, -1.253)
		);
	}

	float rayleighPhase(float cosineTheta) {
		return 3.0 * (1.0 + cosineTheta * cosineTheta) / (16.0 * PI);
	}

	float miePhase(float cosineTheta) {
		float gSquared = MIE_G * MIE_G;
		float scale = 3.0 * (1.0 - gSquared) / (8.0 * PI * (2.0 + gSquared));
		return scale * (1.0 + cosineTheta * cosineTheta) /
			pow(max(1.0 + gSquared - 2.0 * MIE_G * cosineTheta, 0.0001), 1.5);
	}

	void main() {
		vec3 direction = normalize(vWorldPosition - cameraPosition);
		float viewAirMass = airMass(direction.y);
		float sunAirMass = airMass(uSunDirection.y);
		vec3 viewRayleighDepth =
			RAYLEIGH_SCATTERING * RAYLEIGH_HEIGHT * viewAirMass;
		vec3 viewMieDepth = MIE_EXTINCTION * MIE_HEIGHT * viewAirMass;
		vec3 extinctionDepth = viewRayleighDepth + viewMieDepth;
		vec3 scatteringDepth =
			viewRayleighDepth * rayleighPhase(dot(direction, uSunDirection)) +
			MIE_SCATTERING * MIE_HEIGHT * viewAirMass *
				miePhase(dot(direction, uSunDirection));
		vec3 sunTransmittance = exp(-(
			RAYLEIGH_SCATTERING * RAYLEIGH_HEIGHT +
			MIE_EXTINCTION * MIE_HEIGHT
		) * sunAirMass);
		vec3 scattering =
			(1.0 - exp(-extinctionDepth)) *
			scatteringDepth /
			max(extinctionDepth, vec3(1e-6));
		float daylight = smoothstep(-0.1, 0.02, uSunDirection.y);
		vec3 nightSky = vec3(0.0000125, 0.000025, 0.0000625);
		vec3 radiance = nightSky +
			daylight * uSunVisibility * sunTransmittance * scattering * 1.25;

		gl_FragColor = vec4(radiance, 1.0);
		#include <tonemapping_fragment>
		#include <colorspace_fragment>
	}
`;

type AtmosphereProps = {
	sunDirection: LocalDirection;
	sunVisibility: number;
};

export function Atmosphere({ sunDirection, sunVisibility }: AtmosphereProps) {
	const direction = toThreeDirection(sunDirection, new THREE.Vector3());

	return (
		<mesh frustumCulled={false} renderOrder={-1000} scale={500}>
			<boxGeometry />
			<shaderMaterial
				depthWrite={false}
				fragmentShader={FRAGMENT_SHADER}
				side={THREE.BackSide}
				uniforms={{
					uSunDirection: { value: direction },
					uSunVisibility: { value: sunVisibility },
				}}
				vertexShader={VERTEX_SHADER}
			/>
		</mesh>
	);
}
