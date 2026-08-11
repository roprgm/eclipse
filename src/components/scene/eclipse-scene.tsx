import {
	type CelestialBodyState,
	calculateCelestialBodies,
} from "@/lib/celestial-bodies";
import { ECLIPSE_TIMESTAMP, useStore } from "@/store";
import { Billboard } from "@react-three/drei/core/Billboard";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { ObserverControls } from "./observer-controls";
import { toThreeDirection } from "./three-directions";

const SUN_RENDER_DISTANCE = 100;
const MOON_RENDER_DISTANCE = 99;
const INITIAL_CAMERA_PITCH_OFFSET = THREE.MathUtils.degToRad(1.5);
const SUN_COLOR = new THREE.Color(0xffd45a).multiplyScalar(16);

type EclipseSceneProps = {
	exposureEv: number;
};

type CelestialDiscProps = {
	body: CelestialBodyState | null;
	color: THREE.ColorRepresentation;
	distance: number;
	toneMapped?: boolean;
};

function CelestialDisc({
	body,
	color,
	distance,
	toneMapped = true,
}: CelestialDiscProps) {
	if (!body) return null;

	const position = toThreeDirection(
		body.directionEnu,
		new THREE.Vector3(),
	).multiplyScalar(distance);
	const radius = distance * Math.tan(body.angularRadiusRad);

	return (
		<Billboard position={position}>
			<mesh scale={radius}>
				<circleGeometry args={[1, 64]} />
				<meshBasicMaterial
					color={color}
					side={THREE.DoubleSide}
					toneMapped={toneMapped}
				/>
			</mesh>
		</Billboard>
	);
}

function Ground() {
	return (
		<mesh position-y={-0.02} rotation-x={-Math.PI / 2}>
			<circleGeometry args={[250, 128]} />
			<meshBasicMaterial color={0x000000} side={THREE.DoubleSide} />
		</mesh>
	);
}

function Exposure({ exposureEv }: EclipseSceneProps) {
	const renderer = useThree((state) => state.gl);
	const invalidate = useThree((state) => state.invalidate);

	useEffect(() => {
		renderer.toneMappingExposure = 2 ** exposureEv;
		invalidate();
	}, [exposureEv, invalidate, renderer]);

	return null;
}

function CameraTarget() {
	const selectedPoint = useStore((state) => state.selectedPoint);
	const camera = useThree((state) => state.camera);
	const invalidate = useThree((state) => state.invalidate);

	useEffect(() => {
		if (!selectedPoint) return;

		const peak = calculateCelestialBodies({
			...selectedPoint,
			timestamp: new Date(ECLIPSE_TIMESTAMP),
		});
		const targetDirection = toThreeDirection(
			peak.sun.directionEnu,
			new THREE.Vector3(),
		)
			.add(toThreeDirection(peak.moon.directionEnu, new THREE.Vector3()))
			.normalize();
		camera.up.set(
			0,
			Math.abs(targetDirection.y) < 0.9999 ? 1 : 0,
			Math.abs(targetDirection.y) < 0.9999 ? 0 : -1,
		);
		camera.lookAt(targetDirection.multiplyScalar(SUN_RENDER_DISTANCE));
		camera.rotateX(INITIAL_CAMERA_PITCH_OFFSET);
		camera.updateMatrixWorld();
		invalidate();
	}, [camera, invalidate, selectedPoint]);

	return null;
}

function Scene({ exposureEv }: EclipseSceneProps) {
	const sun = useStore((state) => state.sun);
	const moon = useStore((state) => state.moon);

	return (
		<>
			<color args={[0x071426]} attach="background" />
			<Ground />
			<CelestialDisc
				body={sun}
				color={SUN_COLOR}
				distance={SUN_RENDER_DISTANCE}
			/>
			<CelestialDisc
				body={moon}
				color={0x000000}
				distance={MOON_RENDER_DISTANCE}
				toneMapped={false}
			/>
			<Exposure exposureEv={exposureEv} />
			<CameraTarget />
			<ObserverControls />
		</>
	);
}

export function EclipseScene({ exposureEv }: EclipseSceneProps) {
	return (
		<Canvas
			camera={{ far: 1000, fov: 25, near: 0.01, position: [0, 0, 0] }}
			dpr={[1, 2]}
			frameloop="demand"
			gl={{
				antialias: true,
				powerPreference: "high-performance",
				toneMapping: THREE.ACESFilmicToneMapping,
			}}
		>
			<Scene exposureEv={exposureEv} />
		</Canvas>
	);
}
