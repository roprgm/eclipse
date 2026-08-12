import { useFBO } from "@react-three/drei/core/Fbo";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, createContext, useContext, useMemo } from "react";
import * as THREE from "three";

const VERTEX_SHADER = /* glsl */ `
	varying vec2 vUv;

	void main() {
		vUv = uv;
		gl_Position = vec4(position.xy, 0.0, 1.0);
	}
`;

const FRAGMENT_SHADER = /* glsl */ `
	varying vec2 vUv;

	uniform sampler2D uRadiance;

	void main() {
		gl_FragColor = texture2D(uRadiance, vUv);
		#include <tonemapping_fragment>
		#include <colorspace_fragment>
	}
`;

type HdrOutputProps = {
	children: ReactNode;
};

const RadianceSceneContext = createContext<THREE.Scene | null>(null);

export function useRadianceScene() {
	const scene = useContext(RadianceSceneContext);
	if (!scene) throw new Error("useRadianceScene must be used inside HdrOutput");
	return scene;
}

export function HdrOutput({ children }: HdrOutputProps) {
	const camera = useThree((state) => state.camera);
	const outputScene = useThree((state) => state.scene);
	const renderer = useThree((state) => state.gl);
	const radianceScene = useMemo(() => new THREE.Scene(), []);
	const radiance = useFBO({
		colorSpace: THREE.NoColorSpace,
		depthBuffer: true,
		format: THREE.RGBAFormat,
		generateMipmaps: false,
		samples: 4,
		stencilBuffer: false,
		type: THREE.HalfFloatType,
	});
	const uniforms = useMemo(
		() => ({ uRadiance: { value: radiance.texture } }),
		[radiance.texture],
	);

	useFrame(() => {
		const previousTarget = renderer.getRenderTarget();

		renderer.setRenderTarget(radiance);
		renderer.clear();
		renderer.render(radianceScene, camera);

		renderer.setRenderTarget(null);
		renderer.clear();
		renderer.render(outputScene, camera);

		renderer.setRenderTarget(previousTarget);
	}, 1);

	return (
		<>
			{createPortal(
				<RadianceSceneContext.Provider value={radianceScene}>
					{children}
				</RadianceSceneContext.Provider>,
				radianceScene,
			)}
			<mesh frustumCulled={false}>
				<planeGeometry args={[2, 2]} />
				<shaderMaterial
					depthTest={false}
					depthWrite={false}
					fragmentShader={FRAGMENT_SHADER}
					uniforms={uniforms}
					vertexShader={VERTEX_SHADER}
				/>
			</mesh>
		</>
	);
}
