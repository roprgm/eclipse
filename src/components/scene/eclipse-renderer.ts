import {
	type CelestialBodies,
	type LocalDirection,
	type ObserverLocation,
	calculateCelestialBodies,
	calculateSolarCoverage,
} from "@/lib/celestial-bodies";
import { ECLIPSE_PEAK_TIMESTAMP } from "@/store";
import {
	type Gpu,
	VGPUError,
	clock,
	effect,
	frame,
	init,
	sampler,
	surface,
	target,
	timer,
} from "vgpu";
import {
	EXPOSURE_METER_SIZE,
	createExposureController,
} from "./exposure-controller";
import {
	type ObserverCameraView,
	createObserverCamera,
} from "./observer-camera";
import { toRenderDirection } from "./render-direction";
import { createRendererMetrics } from "./renderer-metrics";
import eclipseShader from "./shaders/eclipse.wgsl";
import meterShader from "./shaders/meter.wgsl";
import presentShader from "./shaders/present.wgsl";

const METER_INTERVAL_MILLISECONDS = 100;

export type EclipseRendererInput = {
	autoExposure: boolean;
	bodies: CelestialBodies;
	cameraFocalLength: number;
	exposureStops: number;
	observerLocation: ObserverLocation;
};

type EclipseRendererCallbacks = {
	onEffectiveExposureChange: (stops: number) => void;
	onError: (error: unknown) => void;
	onCameraFocalLengthChange: (focalLength: number) => void;
	onFrameRate: (frameRate: number) => void;
	onGpuTime: (gpuTime: number) => void;
	onReady: () => void;
};

export type EclipseRenderer = {
	dispose: () => void;
	update: (input: EclipseRendererInput) => void;
};

function discAboveHorizonFraction(altitude: number, radius: number) {
	if (altitude >= radius) return 1;
	if (altitude <= -radius) return 0;
	const height = altitude / radius;
	return (Math.acos(-height) + height * Math.sqrt(1 - height ** 2)) / Math.PI;
}

function toBodiesUniform(bodies: CelestialBodies) {
	const { sun, moon } = bodies;
	const sunRadius = Math.tan(sun.angularRadiusRad);
	const sunVisibility = 1 - calculateSolarCoverage(sun, moon);
	const horizonVisibility = discAboveHorizonFraction(
		sun.altitudeRad,
		sun.angularRadiusRad,
	);
	return {
		moonDirection: toRenderDirection(moon.directionEnu),
		moonRadius: Math.tan(moon.angularRadiusRad),
		sunDirection: toRenderDirection(sun.directionEnu),
		sunRadius,
		sunVisibility,
		visibleArea: Math.PI * sunRadius ** 2 * sunVisibility * horizonVisibility,
	};
}

function calculatePeakDirection(location: ObserverLocation): LocalDirection {
	const { sun, moon } = calculateCelestialBodies({
		...location,
		timestamp: new Date(ECLIPSE_PEAK_TIMESTAMP),
	});
	const east = sun.directionEnu.east + moon.directionEnu.east;
	const north = sun.directionEnu.north + moon.directionEnu.north;
	const up = sun.directionEnu.up + moon.directionEnu.up;
	return { east, north, up };
}

function createRendererRuntime(
	gpu: Gpu,
	canvas: HTMLCanvasElement,
	initialInput: EclipseRendererInput,
	callbacks: EclipseRendererCallbacks,
): EclipseRenderer {
	const canvasSurface = surface(gpu, canvas, { dpr: [1, 2] });
	const radianceTarget = target(gpu, {
		format: "rgba16float",
		size: canvasSurface.size,
	});
	const meterTarget = target(gpu, {
		format: "r16float",
		size: [EXPOSURE_METER_SIZE, EXPOSURE_METER_SIZE],
	});
	const meterSampler = sampler(gpu, {
		magFilter: "linear",
		minFilter: "linear",
	});
	const sceneEffect = effect(gpu, eclipseShader, {
		label: "eclipse scene",
		set: {
			bodies: toBodiesUniform(initialInput.bodies),
			camera: {
				aspect: 1,
				forward: [0, 0, -1],
				right: [1, 0, 0],
				tanHalfFov: 1,
				up: [0, 1, 0],
			},
		},
	});
	const meterEffect = effect(gpu, meterShader, {
		label: "exposure meter",
		set: { radiance: radianceTarget, radianceSampler: meterSampler },
	});
	const exposure = createExposureController(
		callbacks.onEffectiveExposureChange,
	);
	const presentEffect = effect(gpu, presentShader, {
		label: "HDR output",
		set: {
			exposureStops: exposure.getDisplayStops(),
			radiance: radianceTarget,
		},
	});
	const syncExposureUniform = () =>
		presentEffect.set({ exposureStops: exposure.getDisplayStops() });
	const time = clock(gpu);
	const metrics = createRendererMetrics(time, callbacks);
	const gpuTimer = gpu.device.features.has("timestamp-query")
		? timer(gpu)
		: null;
	const scenePass = {
		target: radianceTarget,
		timer: gpuTimer?.span("scene"),
	};
	const meterPass = {
		target: meterTarget,
		timer: gpuTimer?.span("meter"),
	};
	const presentPass = {
		target: canvasSurface,
		timer: gpuTimer?.span("present"),
	};
	gpuTimer?.onResults(metrics.recordGpuSpans);
	let disposed = false;
	let animationFrameId: number | undefined;
	let meterTimeoutId: number | undefined;
	let meterReadPending = false;
	let meterNeedsUpdate = true;
	let sceneRevision = 0;
	let renderedSceneRevision = -1;
	let lastMeteredAt = Number.NEGATIVE_INFINITY;
	let currentBodies = initialInput.bodies;
	let currentLocation = initialInput.observerLocation;
	let hasRendered = false;
	const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
	exposure.setReducedMotion(reducedMotion.matches);

	function requestFrame() {
		if (disposed || animationFrameId !== undefined) return;
		animationFrameId = requestAnimationFrame(drawFrame);
	}

	function updateCameraView(view: ObserverCameraView) {
		sceneEffect.set({ camera: view });
		sceneRevision += 1;
		meterNeedsUpdate = true;
		requestFrame();
	}

	const camera = createObserverCamera(canvas, {
		focalLength: initialInput.cameraFocalLength,
		onFocalLengthChange: callbacks.onCameraFocalLengthChange,
		onViewChange: updateCameraView,
	});
	camera.setTarget(calculatePeakDirection(initialInput.observerLocation));

	function scheduleMeterFrame(now: number) {
		if (
			disposed ||
			!exposure.isAutomatic() ||
			!meterNeedsUpdate ||
			meterReadPending ||
			meterTimeoutId !== undefined
		) {
			return;
		}
		const delay = Math.max(
			0,
			METER_INTERVAL_MILLISECONDS - (now - lastMeteredAt),
		);
		meterTimeoutId = window.setTimeout(() => {
			meterTimeoutId = undefined;
			requestFrame();
		}, delay);
	}

	async function readExposureMeter(revision: number) {
		meterReadPending = true;
		try {
			const pixels = await meterTarget.readFloats();
			if (disposed) return;
			if (
				revision === sceneRevision &&
				exposure.updateFromMeter(pixels, performance.now())
			) {
				meterNeedsUpdate = true;
			}
		} catch (error) {
			if (!disposed) callbacks.onError(error);
		} finally {
			meterReadPending = false;
			requestFrame();
		}
	}

	function drawFrame(now: number) {
		animationFrameId = undefined;
		if (disposed) return;
		const shouldRenderMeter =
			exposure.isAutomatic() &&
			meterNeedsUpdate &&
			!meterReadPending &&
			now - lastMeteredAt >= METER_INTERVAL_MILLISECONDS;
		if (shouldRenderMeter) {
			meterNeedsUpdate = false;
			lastMeteredAt = now;
		}

		const measuredRevision = shouldRenderMeter ? sceneRevision : undefined;
		let exposureChanged = false;
		frame(gpu, (currentFrame) => {
			exposureChanged = exposure.advance(Math.min(time.deltaTime, 0.1));
			if (exposureChanged) syncExposureUniform();
			if (renderedSceneRevision !== sceneRevision) {
				currentFrame.pass(scenePass, sceneEffect);
				renderedSceneRevision = sceneRevision;
			}
			if (shouldRenderMeter) {
				currentFrame.pass(meterPass, meterEffect);
			}
			currentFrame.pass(presentPass, presentEffect);
		});
		metrics.recordFrame();
		if (measuredRevision !== undefined) {
			void readExposureMeter(measuredRevision);
		}
		if (!hasRendered) {
			hasRendered = true;
			callbacks.onReady();
		}
		if (exposureChanged) requestFrame();
		scheduleMeterFrame(now);
	}

	canvasSurface.onResize(({ width, height }) => {
		radianceTarget.resize([width, height]);
		camera.updateAspect();
	});
	gpu.onError((error) => {
		if (!disposed) callbacks.onError(error);
	});
	const resizeObserver = new ResizeObserver(requestFrame);
	resizeObserver.observe(canvas);
	const handleReducedMotion = (event: MediaQueryListEvent) => {
		exposure.setReducedMotion(event.matches);
		requestFrame();
	};
	reducedMotion.addEventListener("change", handleReducedMotion);

	function dispose() {
		disposed = true;
		if (animationFrameId !== undefined) {
			cancelAnimationFrame(animationFrameId);
		}
		if (meterTimeoutId !== undefined) clearTimeout(meterTimeoutId);
		resizeObserver.disconnect();
		reducedMotion.removeEventListener("change", handleReducedMotion);
		camera.dispose();
		gpu.dispose();
	}

	function update(input: EclipseRendererInput) {
		const exposureChanged = exposure.update({
			automatic: input.autoExposure,
			stops: input.exposureStops,
		});
		if (exposureChanged) {
			syncExposureUniform();
			if (input.autoExposure) meterNeedsUpdate = true;
		}
		camera.setFocalLength(input.cameraFocalLength);

		if (input.bodies !== currentBodies) {
			currentBodies = input.bodies;
			sceneEffect.set({ bodies: toBodiesUniform(input.bodies) });
			sceneRevision += 1;
			meterNeedsUpdate = true;
		}

		if (input.observerLocation !== currentLocation) {
			currentLocation = input.observerLocation;
			camera.setTarget(calculatePeakDirection(input.observerLocation));
		}
		requestFrame();
	}

	return { dispose, update };
}

async function initGpu() {
	try {
		return await init({
			powerPreference: "high-performance",
			requiredFeatures: ["timestamp-query"],
		});
	} catch (error) {
		if (
			!(error instanceof VGPUError) ||
			error.code !== "VGPU-FEATURE-UNSUPPORTED"
		) {
			throw error;
		}
		return init({ powerPreference: "high-performance" });
	}
}

export async function createEclipseRenderer(
	canvas: HTMLCanvasElement,
	initialInput: EclipseRendererInput,
	callbacks: EclipseRendererCallbacks,
) {
	const gpu = await initGpu();
	try {
		return createRendererRuntime(gpu, canvas, initialInput, callbacks);
	} catch (error) {
		gpu.dispose();
		throw error;
	}
}
