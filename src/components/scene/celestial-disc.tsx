import type { CelestialBodyState } from "@/lib/celestial-bodies";
import { Billboard } from "@react-three/drei/core/Billboard";
import { useMemo } from "react";
import * as THREE from "three";
import { toThreeDirection } from "./three-directions";

const DISC_PADDING = 1.1;

const VERTEX_SHADER = /* glsl */ `
	varying vec2 vPosition;

	void main() {
		vPosition = position.xy;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const FRAGMENT_SHADER = /* glsl */ `
	varying vec2 vPosition;

	uniform vec3 uColor;
	uniform float uRadius;

	void main() {
		float distanceToEdge = uRadius - length(vPosition);
		float coverage = smoothstep(
			-fwidth(distanceToEdge),
			fwidth(distanceToEdge),
			distanceToEdge
		);
		if (coverage <= 0.0) discard;

		gl_FragColor = vec4(uColor, coverage);
		#include <tonemapping_fragment>
		#include <colorspace_fragment>
	}
`;

type CelestialDiscProps = {
	body: CelestialBodyState | null;
	color: THREE.ColorRepresentation;
	distance: number;
	toneMapped?: boolean;
};

export function CelestialDisc({
	body,
	color,
	distance,
	toneMapped = true,
}: CelestialDiscProps) {
	const uniforms = useMemo(
		() => ({
			uColor: { value: new THREE.Color(color) },
			uRadius: { value: 1 / DISC_PADDING },
		}),
		[color],
	);

	if (!body) return null;

	const position = toThreeDirection(
		body.directionEnu,
		new THREE.Vector3(),
	).multiplyScalar(distance);
	const radius = distance * Math.tan(body.angularRadiusRad) * DISC_PADDING;

	return (
		<Billboard position={position}>
			<mesh scale={radius}>
				<planeGeometry args={[2, 2]} />
				<shaderMaterial
					depthWrite={false}
					fragmentShader={FRAGMENT_SHADER}
					side={THREE.DoubleSide}
					toneMapped={toneMapped}
					transparent
					uniforms={uniforms}
					vertexShader={VERTEX_SHADER}
				/>
			</mesh>
		</Billboard>
	);
}
