import type { CelestialBodyState } from "@/lib/celestial-bodies";
import { useMemo } from "react";
import * as THREE from "three";
import { createSolarFrame } from "./solar-frame";

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
	uniform vec2 uMoonCenter;
	uniform bool uMoonClips;
	uniform float uMoonRadius;
	uniform float uSunRadius;

	float visibleAt(vec2 position) {
		if (length(position) > uSunRadius) return 0.0;
		if (uMoonClips && length(position - uMoonCenter) < uMoonRadius) {
			return 0.0;
		}
		return 1.0;
	}

	void main() {
		vec2 pixelX = dFdx(vPosition);
		vec2 pixelY = dFdy(vPosition);
		float coverage = 0.0;
		for (int y = 0; y < 4; y += 1) {
			for (int x = 0; x < 4; x += 1) {
				vec2 offset = (vec2(float(x), float(y)) + 0.5) / 4.0 - 0.5;
				coverage += visibleAt(
					vPosition + pixelX * offset.x + pixelY * offset.y
				);
			}
		}
		coverage /= 16.0;
		if (coverage <= 0.0) discard;
		gl_FragColor = vec4(uColor * coverage, 0.0);
	}
`;

type SolarDiscProps = {
	sun: CelestialBodyState | null;
	moon: CelestialBodyState | null;
	color: THREE.ColorRepresentation;
	distance: number;
};

export function SolarDisc({ sun, moon, color, distance }: SolarDiscProps) {
	const rendering = useMemo(() => {
		if (!sun || !moon) return null;

		const frame = createSolarFrame(sun, moon, distance);
		if (frame.moonCenter.length() + frame.sunRadius <= frame.moonRadius) {
			return null;
		}
		const angularScale = frame.sunRadius * DISC_PADDING;
		return {
			position: frame.position,
			quaternion: frame.quaternion,
			scale: distance * angularScale,
			uniforms: {
				uColor: { value: new THREE.Color(color) },
				uMoonCenter: {
					value: frame.moonCenter.clone().divideScalar(angularScale),
				},
				uMoonClips: {
					value: frame.moonCenter.length() < frame.sunRadius + frame.moonRadius,
				},
				uMoonRadius: { value: frame.moonRadius / angularScale },
				uSunRadius: { value: 1 / DISC_PADDING },
			},
		};
	}, [color, distance, moon, sun]);

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
				blendDstAlpha={THREE.OneFactor}
				blendEquation={THREE.AddEquation}
				blending={THREE.CustomBlending}
				blendSrc={THREE.OneFactor}
				blendSrcAlpha={THREE.ZeroFactor}
				depthTest={false}
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
