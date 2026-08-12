import { focalLengthToVerticalFov } from "@/lib/camera";
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
import { FrameRate } from "./frame-rate";
import { HdrOutput } from "./hdr-output";
import { ObserverControls } from "./observer-controls";
import { SolarCorona } from "./solar-corona";
import { SolarDisc } from "./solar-disc";
import { SolarGlare } from "./solar-glare";
import { toThreeDirection } from "./three-directions";

const SUN_RENDER_DISTANCE = 100;
const MOON_RENDER_DISTANCE = 99;
const INITIAL_CAMERA_PITCH_OFFSET = THREE.MathUtils.degToRad(1.5);
const REFERENCE_SOLAR_ANGULAR_RADIUS = 0.00465;
const SOLAR_IRRADIANCE = 1.25;
const SOLAR_MEAN_RADIANCE_FACTOR = 0.8;
const SOLAR_RADIANCE = new THREE.Color(0xffd45a).multiplyScalar(
	SOLAR_IRRADIANCE /
		(Math.PI *
			REFERENCE_SOLAR_ANGULAR_RADIUS ** 2 *
			SOLAR_MEAN_RADIANCE_FACTOR),
);
type EclipseSceneProps = {
	autoExposure: boolean;
	cameraFocalLength: number;
	exposureStops: number;
	onCameraFocalLengthChange: (focalLength: number) => void;
};

function Ground() {
	return (
		<mesh position-y={-0.02} renderOrder={2000} rotation-x={-Math.PI / 2}>
			<circleGeometry args={[250, 128]} />
			<meshBasicMaterial
				color={0x000000}
				depthFunc={THREE.AlwaysDepth}
				side={THREE.DoubleSide}
			/>
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

function Scene({
	autoExposure,
	cameraFocalLength,
	exposureStops,
	onCameraFocalLengthChange,
}: EclipseSceneProps) {
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
			<SolarCorona
				body={sun}
				color={SOLAR_RADIANCE}
				distance={SUN_RENDER_DISTANCE}
				moon={moon}
			/>
			<SolarGlare
				sun={sun}
				moon={moon}
				color={SOLAR_RADIANCE}
				distance={SUN_RENDER_DISTANCE}
			/>
			<SolarDisc
				color={SOLAR_RADIANCE}
				distance={SUN_RENDER_DISTANCE}
				moon={moon}
				sun={sun}
			/>
			<CelestialDisc
				body={moon}
				color={0x000000}
				distance={MOON_RENDER_DISTANCE}
				occludes
			/>
			<AutoExposure
				enabled={autoExposure && Boolean(sun)}
				exposureStops={exposureStops}
			/>
			<CameraTarget />
			<ObserverControls
				focalLength={cameraFocalLength}
				onFocalLengthChange={onCameraFocalLengthChange}
			/>
			<FrameRate />
		</>
	);
}

export function EclipseScene({
	autoExposure,
	cameraFocalLength,
	exposureStops,
	onCameraFocalLengthChange,
}: EclipseSceneProps) {
	const cameraFov = focalLengthToVerticalFov(cameraFocalLength);

	return (
		<Canvas
			camera={{ far: 1000, fov: cameraFov, near: 0.01, position: [0, 0, 0] }}
			dpr={[1, 2]}
			frameloop="demand"
			gl={{
				antialias: true,
				powerPreference: "high-performance",
				toneMapping: THREE.ACESFilmicToneMapping,
			}}
		>
			<HdrOutput>
				<Scene
					autoExposure={autoExposure}
					cameraFocalLength={cameraFocalLength}
					exposureStops={exposureStops}
					onCameraFocalLengthChange={onCameraFocalLengthChange}
				/>
			</HdrOutput>
		</Canvas>
	);
}
