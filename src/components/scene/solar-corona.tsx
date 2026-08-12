import type { CelestialBodyState } from "@/lib/celestial-bodies";
import { useMemo } from "react";
import * as THREE from "three";
import { createSolarFrame } from "./solar-frame";

const CORONA_RADIUS = 6;

const VERTEX_SHADER = /* glsl */ `
	varying vec2 vPosition;

	void main() {
		vPosition = position.xy;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const FRAGMENT_SHADER = /* glsl */ `
	varying vec2 vPosition;

	uniform vec2 uMoonCenter;
	uniform bool uMoonClips;
	uniform float uMoonRadius;
	uniform vec3 uSolarRadiance;
	uniform float uSunAltitude;

	const vec3 EXTINCTION =
		vec3(5.802e-6, 13.558e-6, 33.1e-6) * 8000.0 +
		vec3(4.44e-6) * 1200.0;

	float airMass(float cosineZenith) {
		float angleDegrees = degrees(acos(clamp(cosineZenith, 0.0, 1.0)));
		return 1.0 / (
			max(cosineZenith, 0.0) +
			0.15 * pow(93.885 - angleDegrees, -1.253)
		);
	}

	void main() {
		vec2 pixelX = dFdx(vPosition);
		vec2 pixelY = dFdy(vPosition);
		float moonCoverage = 0.0;
		for (int y = 0; y < 4; y += 1) {
			for (int x = 0; x < 4; x += 1) {
				vec2 offset = (vec2(float(x), float(y)) + 0.5) / 4.0 - 0.5;
				vec2 position = vPosition + pixelX * offset.x + pixelY * offset.y;
				moonCoverage +=
					!uMoonClips || length(position - uMoonCenter) >= uMoonRadius
						? 1.0
						: 0.0;
			}
		}
		moonCoverage /= 16.0;
		if (moonCoverage <= 0.0) discard;

		float radius = length(vPosition) * ${CORONA_RADIUS.toFixed(1)};
		float edgeWidth = fwidth(radius);
		float innerCoverage = smoothstep(1.0 - edgeWidth, 1.0 + edgeWidth, radius);
		float outerCoverage = 1.0 - smoothstep(3.0, 5.5, radius);
		float profileRadius = max(radius, 1.0);
		float angle = atan(vPosition.y, vPosition.x);
		float streamers =
			1.0 +
			0.22 * cos(2.0 * angle + 0.4) +
			0.10 * cos(5.0 * angle - 1.1) +
			0.05 * cos(11.0 * angle + 0.7);
		float ripples = 1.0 + 0.04 * cos(7.0 * (profileRadius - 1.0));
		float brightness = 1e-6 * streamers * ripples * (
			2.565 / pow(profileRadius, 17.0) +
			1.425 / pow(profileRadius, 7.0) +
			0.0532 / pow(profileRadius, 2.5)
		);
		brightness *= innerCoverage * outerCoverage * moonCoverage;
		if (brightness <= 0.0) discard;

		vec3 transmittance = exp(-EXTINCTION * airMass(uSunAltitude));
		gl_FragColor = vec4(uSolarRadiance * transmittance * brightness, 1.0);
	}
`;

type SolarCoronaProps = {
	body: CelestialBodyState | null;
	moon: CelestialBodyState | null;
	color: THREE.ColorRepresentation;
	distance: number;
};

export function SolarCorona({ body, moon, color, distance }: SolarCoronaProps) {
	const rendering = useMemo(() => {
		if (!body || !moon) return null;

		const frame = createSolarFrame(body, moon, distance);
		const scale = frame.sunRadius * CORONA_RADIUS;
		return {
			position: frame.position,
			quaternion: frame.quaternion,
			scale: distance * scale,
			uniforms: {
				uMoonCenter: { value: frame.moonCenter.clone().divideScalar(scale) },
				uMoonClips: {
					value:
						frame.moonCenter.length() <
						frame.sunRadius * CORONA_RADIUS + frame.moonRadius,
				},
				uMoonRadius: { value: frame.moonRadius / scale },
				uSolarRadiance: { value: new THREE.Color(color) },
				uSunAltitude: { value: body.directionEnu.up },
			},
		};
	}, [body, color, distance, moon]);

	if (!rendering) return null;

	return (
		<mesh
			position={rendering.position}
			quaternion={rendering.quaternion}
			scale={rendering.scale}
		>
			<planeGeometry args={[2, 2]} />
			<shaderMaterial
				blendDst={THREE.OneFactor}
				blendEquation={THREE.AddEquation}
				blending={THREE.CustomBlending}
				blendSrc={THREE.OneFactor}
				depthWrite={false}
				fragmentShader={FRAGMENT_SHADER}
				side={THREE.DoubleSide}
				transparent
				uniforms={rendering.uniforms}
				vertexShader={VERTEX_SHADER}
			/>
		</mesh>
	);
}
