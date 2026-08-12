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
	}
`;

type CelestialDiscProps = {
	body: CelestialBodyState | null;
	color: THREE.ColorRepresentation;
	distance: number;
	occludes?: boolean;
};

export function CelestialDisc({
	body,
	color,
	distance,
	occludes = false,
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
			<mesh renderOrder={occludes ? -500 : 0} scale={radius}>
				<planeGeometry args={[2, 2]} />
				<shaderMaterial
					alphaToCoverage
					colorWrite={!occludes}
					depthWrite={occludes}
					fragmentShader={FRAGMENT_SHADER}
					side={THREE.DoubleSide}
					uniforms={uniforms}
					vertexShader={VERTEX_SHADER}
				/>
			</mesh>
		</Billboard>
	);
}
