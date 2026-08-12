import { MAX_ISO_STOPS, MIN_ISO_STOPS } from "@/lib/exposure";
import { useStore } from "@/store";
import { useFBO } from "@react-three/drei/core/Fbo";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useRadianceScene } from "./hdr-output";

const METER_SIZE = 32;
const METER_INTERVAL_MILLISECONDS = 100;
const ISO_DEBOUNCE_MILLISECONDS = 200;
const ISO_TRANSITION_SECONDS = 1.2;
const CAMERA_CALIBRATION_STOPS = -0.3;
const AUTOMATIC_BIAS_STOPS = -0.5;
const MIDDLE_GRAY = 0.18;
const HIGHLIGHT_LEVEL = 0.9;

type ExposureRuntime = {
	currentStops: number;
	lastMeasurement: number;
	pendingIsoStops: number | null;
	pendingSince: number;
	previousEnabled: boolean;
	previousExposureStops: number;
	targetIsoStops: number;
	transitionElapsed: number;
	transitionStartStops: number;
	unclampedTargetStops: number;
};

const METER_WEIGHTS = Float32Array.from(
	{ length: METER_SIZE * METER_SIZE },
	(_, index) => {
		const x = ((index % METER_SIZE) + 0.5) / METER_SIZE - 0.5;
		const y = (Math.floor(index / METER_SIZE) + 0.5) / METER_SIZE - 0.5;
		return Math.exp(-4 * (x * x + y * y));
	},
);
const METER_WEIGHT_SUM = METER_WEIGHTS.reduce((sum, weight) => sum + weight, 0);

function measureScene(pixels: Uint16Array, luminances: Float32Array) {
	let weightedLogLuminance = 0;

	for (let index = 0; index < METER_WEIGHTS.length; index += 1) {
		const offset = index * 4;
		const luminance =
			0.2126 * THREE.DataUtils.fromHalfFloat(pixels[offset]) +
			0.7152 * THREE.DataUtils.fromHalfFloat(pixels[offset + 1]) +
			0.0722 * THREE.DataUtils.fromHalfFloat(pixels[offset + 2]);
		weightedLogLuminance +=
			METER_WEIGHTS[index] * Math.log2(Math.max(luminance, 1e-6));
		luminances[index] = luminance;
	}

	luminances.sort();

	return {
		highlight: luminances[Math.floor(luminances.length * 0.98)],
		middle: 2 ** (weightedLogLuminance / METER_WEIGHT_SUM),
	};
}

function quantizeIsoStops(stops: number) {
	return THREE.MathUtils.clamp(Math.round(stops), MIN_ISO_STOPS, MAX_ISO_STOPS);
}

function startTransition(
	runtime: ExposureRuntime,
	targetIsoStops: number,
	setEffectiveExposureStops: (stops: number) => void,
) {
	if (targetIsoStops === runtime.targetIsoStops) return;

	runtime.transitionStartStops = runtime.currentStops;
	runtime.targetIsoStops = targetIsoStops;
	runtime.transitionElapsed = 0;
	setEffectiveExposureStops(targetIsoStops);
}

function updateAutomaticTarget(
	runtime: ExposureRuntime,
	targetStops: number,
	now: number,
	setEffectiveExposureStops: (stops: number) => void,
) {
	const targetIsoStops = quantizeIsoStops(targetStops);

	if (targetIsoStops === runtime.targetIsoStops) {
		runtime.unclampedTargetStops = targetStops;
		runtime.pendingIsoStops = null;
		return;
	}

	if (targetIsoStops !== runtime.pendingIsoStops) {
		runtime.pendingIsoStops = targetIsoStops;
		runtime.pendingSince = now;
		return;
	}

	if (now - runtime.pendingSince < ISO_DEBOUNCE_MILLISECONDS) return;

	runtime.unclampedTargetStops = targetStops;
	runtime.pendingIsoStops = null;
	startTransition(runtime, targetIsoStops, setEffectiveExposureStops);
}

type AutoExposureProps = {
	enabled: boolean;
	exposureStops: number;
};

export function AutoExposure({ enabled, exposureStops }: AutoExposureProps) {
	const camera = useThree((state) => state.camera);
	const renderer = useThree((state) => state.gl);
	const scene = useRadianceScene();
	const invalidate = useThree((state) => state.invalidate);
	const setEffectiveExposureStops = useStore(
		(state) => state.setEffectiveExposureStops,
	);
	const meter = useFBO(METER_SIZE, METER_SIZE, {
		depthBuffer: true,
		generateMipmaps: false,
		stencilBuffer: false,
		type: THREE.HalfFloatType,
	});
	const pixels = useRef(new Uint16Array(METER_SIZE * METER_SIZE * 4));
	const luminances = useRef(new Float32Array(METER_SIZE * METER_SIZE));
	const runtime = useRef<ExposureRuntime>({
		currentStops: 0,
		lastMeasurement: Number.NEGATIVE_INFINITY,
		pendingIsoStops: null,
		pendingSince: 0,
		previousEnabled: false,
		previousExposureStops: exposureStops,
		targetIsoStops: 0,
		transitionElapsed: ISO_TRANSITION_SECONDS,
		transitionStartStops: 0,
		unclampedTargetStops: 0,
	});

	useEffect(() => {
		const state = runtime.current;
		const wasEnabled = state.previousEnabled;
		const exposureDelta = exposureStops - state.previousExposureStops;
		state.previousEnabled = enabled;
		state.previousExposureStops = exposureStops;
		state.pendingIsoStops = null;
		state.lastMeasurement = Number.NEGATIVE_INFINITY;

		if (!enabled) {
			const manualIsoStops = quantizeIsoStops(exposureStops);
			state.currentStops = manualIsoStops;
			state.transitionStartStops = manualIsoStops;
			state.unclampedTargetStops = manualIsoStops;
			state.targetIsoStops = manualIsoStops;
			state.transitionElapsed = ISO_TRANSITION_SECONDS;
			setEffectiveExposureStops(manualIsoStops);
		}

		if (enabled && wasEnabled && exposureDelta !== 0) {
			state.unclampedTargetStops += exposureDelta;
			startTransition(
				state,
				quantizeIsoStops(state.unclampedTargetStops),
				setEffectiveExposureStops,
			);
		}

		renderer.toneMappingExposure =
			2 ** (state.currentStops + CAMERA_CALIBRATION_STOPS);
		invalidate();
	}, [enabled, exposureStops, invalidate, renderer, setEffectiveExposureStops]);

	useFrame((_, deltaSeconds) => {
		if (!enabled) return;

		const state = runtime.current;
		const now = performance.now();
		if (now - state.lastMeasurement >= METER_INTERVAL_MILLISECONDS) {
			const previousTarget = renderer.getRenderTarget();
			renderer.setRenderTarget(meter);
			renderer.render(scene, camera);
			renderer.readRenderTargetPixels(
				meter,
				0,
				0,
				METER_SIZE,
				METER_SIZE,
				pixels.current,
			);
			renderer.setRenderTarget(previousTarget);

			const measured = measureScene(pixels.current, luminances.current);
			const middleTarget = Math.log2(MIDDLE_GRAY / measured.middle);
			const highlightTarget = Math.log2(HIGHLIGHT_LEVEL / measured.highlight);
			const automaticStops =
				Math.min(middleTarget, highlightTarget) + AUTOMATIC_BIAS_STOPS;
			updateAutomaticTarget(
				state,
				automaticStops + exposureStops,
				now,
				setEffectiveExposureStops,
			);
			state.lastMeasurement = now;
		}

		if (state.transitionElapsed < ISO_TRANSITION_SECONDS) {
			state.transitionElapsed = Math.min(
				state.transitionElapsed + deltaSeconds,
				ISO_TRANSITION_SECONDS,
			);
			const progress = state.transitionElapsed / ISO_TRANSITION_SECONDS;
			const easedProgress = THREE.MathUtils.smootherstep(progress, 0, 1);
			state.currentStops = THREE.MathUtils.lerp(
				state.transitionStartStops,
				state.targetIsoStops,
				easedProgress,
			);
			renderer.toneMappingExposure =
				2 ** (state.currentStops + CAMERA_CALIBRATION_STOPS);
		}

		if (
			state.pendingIsoStops !== null ||
			state.transitionElapsed < ISO_TRANSITION_SECONDS
		) {
			invalidate();
		}
	}, -1);

	return null;
}
