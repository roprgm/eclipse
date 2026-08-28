import type { Clock } from "vgpu";

const REPORT_INTERVAL_SECONDS = 0.5;
const INACTIVITY_THRESHOLD_SECONDS = 0.1;

type RendererMetricsCallbacks = {
	onFrameRate: (frameRate: number) => void;
	onGpuTime: (gpuTime: number) => void;
};

export function createRendererMetrics(
	time: Clock,
	callbacks: RendererMetricsCallbacks,
) {
	let sampleFrame = time.frameCount;
	let sampleTime = time.time;
	let gpuSamples = 0;
	let totalGpuTime = 0;
	let lastGpuReport = Number.NEGATIVE_INFINITY;

	return {
		recordFrame: () => {
			if (time.deltaTime >= INACTIVITY_THRESHOLD_SECONDS) {
				sampleFrame = time.frameCount;
				sampleTime = time.time;
				return;
			}

			const elapsed = time.time - sampleTime;
			if (elapsed < REPORT_INTERVAL_SECONDS) return;

			callbacks.onFrameRate((time.frameCount - sampleFrame) / elapsed);
			sampleFrame = time.frameCount;
			sampleTime = time.time;
		},
		recordGpuSpans: (spans: Readonly<Record<string, number>>) => {
			const gpuTime = Object.values(spans).reduce(
				(total, duration) => total + duration,
				0,
			);
			if (gpuTime <= 0) return;

			gpuSamples += 1;
			totalGpuTime += gpuTime;
			const now = performance.now();
			if (now - lastGpuReport < REPORT_INTERVAL_SECONDS * 1_000) return;

			callbacks.onGpuTime(totalGpuTime / gpuSamples);
			gpuSamples = 0;
			totalGpuTime = 0;
			lastGpuReport = now;
		},
	};
}
