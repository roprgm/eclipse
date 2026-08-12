import type { CelestialBodyState } from "@/lib/celestial-bodies";
import { Billboard } from "@react-three/drei/core/Billboard";
import { useMemo } from "react";
import * as THREE from "three";
import { toThreeDirection } from "./three-directions";

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
		brightness *= innerCoverage * outerCoverage;
		if (brightness <= 0.0) discard;

		vec3 transmittance = exp(-EXTINCTION * airMass(uSunAltitude));
		gl_FragColor = vec4(uSolarRadiance * transmittance * brightness, 1.0);
	}
`;

type SolarCoronaProps = {
	body: CelestialBodyState | null;
	color: THREE.ColorRepresentation;
	distance: number;
};

export function SolarCorona({ body, color, distance }: SolarCoronaProps) {
	const altitude = body?.directionEnu.up ?? 0;
	const uniforms = useMemo(
		() => ({
			uSolarRadiance: { value: new THREE.Color(color) },
			uSunAltitude: { value: altitude },
		}),
		[altitude, color],
	);

	if (!body) return null;

	const position = toThreeDirection(
		body.directionEnu,
		new THREE.Vector3(),
	).multiplyScalar(distance);
	const solarRadius = distance * Math.tan(body.angularRadiusRad);

	return (
		<Billboard position={position}>
			<mesh scale={solarRadius * CORONA_RADIUS}>
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
					uniforms={uniforms}
					vertexShader={VERTEX_SHADER}
				/>
			</mesh>
		</Billboard>
	);
}
