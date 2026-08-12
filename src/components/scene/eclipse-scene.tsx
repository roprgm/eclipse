import {
	calculateCelestialBodies,
	calculateSolarCoverage,
} from "@/lib/celestial-bodies";
import { ECLIPSE_TIMESTAMP, useStore } from "@/store";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { Atmosphere } from "./atmosphere";
import { AutoExposure } from "./auto-exposure";
import { CelestialDisc } from "./celestial-disc";
import { HdrOutput } from "./hdr-output";
import { ObserverControls } from "./observer-controls";
import { toThreeDirection } from "./three-directions";

const SUN_RENDER_DISTANCE = 100;
const MOON_RENDER_DISTANCE = 99;
const INITIAL_CAMERA_PITCH_OFFSET = THREE.MathUtils.degToRad(1.5);
const SUN_COLOR = new THREE.Color(0xffd45a);

type EclipseSceneProps = {
	autoExposure: boolean;
	exposureStops: number;
};

function Ground() {
	return (
		<mesh position-y={-0.02} rotation-x={-Math.PI / 2}>
			<circleGeometry args={[250, 128]} />
			<meshBasicMaterial color={0x000000} side={THREE.DoubleSide} />
		</mesh>
	);
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

function Scene({ autoExposure, exposureStops }: EclipseSceneProps) {
	const sun = useStore((state) => state.sun);
	const moon = useStore((state) => state.moon);
	const sunVisibility = sun && moon ? 1 - calculateSolarCoverage(sun, moon) : 1;

	return (
		<>
			<color args={[0x071426]} attach="background" />
			{sun ? (
				<Atmosphere
					sunDirection={sun.directionEnu}
					sunVisibility={sunVisibility}
				/>
			) : null}
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
			<AutoExposure
				enabled={autoExposure && Boolean(sun)}
				exposureStops={exposureStops}
			/>
			<CameraTarget />
			<ObserverControls />
		</>
	);
}

export function EclipseScene({
	autoExposure,
	exposureStops,
}: EclipseSceneProps) {
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
			<HdrOutput>
				<Scene autoExposure={autoExposure} exposureStops={exposureStops} />
			</HdrOutput>
		</Canvas>
	);
}
