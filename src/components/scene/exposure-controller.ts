import { MAX_ISO_STOPS, MIN_ISO_STOPS } from "@/lib/exposure";

const MIDDLE_GRAY = 0.18;
const HIGHLIGHT_LEVEL = 0.9;
const AUTOMATIC_BIAS_STOPS = -0.5;
const CAMERA_CALIBRATION_STOPS = -0.3;
const ISO_DEBOUNCE_MILLISECONDS = 200;
const ISO_TRANSITION_SECONDS = 1.2;

export const EXPOSURE_METER_SIZE = 32;

type ExposureSettings = {
	automatic: boolean;
	stops: number;
};

const meterWeights = Float32Array.from(
	{ length: EXPOSURE_METER_SIZE ** 2 },
	(_, index) => {
		const x = ((index % EXPOSURE_METER_SIZE) + 0.5) / EXPOSURE_METER_SIZE - 0.5;
		const y =
			(Math.floor(index / EXPOSURE_METER_SIZE) + 0.5) / EXPOSURE_METER_SIZE -
			0.5;
		return Math.exp(-4 * (x * x + y * y));
	},
);
const meterWeightSum = meterWeights.reduce((sum, weight) => sum + weight, 0);

function quantizeStops(stops: number) {
	return Math.min(MAX_ISO_STOPS, Math.max(MIN_ISO_STOPS, Math.round(stops)));
}

function smootherStep(progress: number) {
	const value = Math.min(1, Math.max(0, progress));
	return value ** 3 * (value * (value * 6 - 15) + 10);
}

function measureLuminance(luminances: Float32Array) {
	let weightedLogLuminance = 0;

	for (let index = 0; index < meterWeights.length; index += 1) {
		const luminance = luminances[index];
		weightedLogLuminance +=
			meterWeights[index] * Math.log2(Math.max(luminance, 1e-6));
	}
	luminances.sort();

	return {
		highlight: luminances[Math.floor(luminances.length * 0.98)],
		middle: 2 ** (weightedLogLuminance / meterWeightSum),
	};
}

export function createExposureController(
	onTargetChange: (stops: number) => void,
) {
	let automatic = false;
	let compensationStops = 0;
	let currentStops = 0;
	let targetStops = 0;
	let transitionElapsed = ISO_TRANSITION_SECONDS;
	let transitionStartStops = 0;
	let unclampedTargetStops = 0;
	let pendingStops: number | undefined;
	let pendingSince = 0;
	let reducedMotion = false;
	const startTransition = (stops: number) => {
		const next = quantizeStops(stops);
		if (next === targetStops) return false;
		transitionStartStops = currentStops;
		targetStops = next;
		transitionElapsed = 0;
		onTargetChange(next);
		return true;
	};

	return {
		getDisplayStops: () => currentStops + CAMERA_CALIBRATION_STOPS,
		isAutomatic: () => automatic,
		updateFromMeter: (pixels: Float32Array, now: number) => {
			if (!automatic) return false;
			const measured = measureLuminance(pixels);
			const middleTarget = Math.log2(MIDDLE_GRAY / measured.middle);
			const highlightTarget = Math.log2(
				HIGHLIGHT_LEVEL / Math.max(measured.highlight, 1e-6),
			);
			const measuredStops =
				Math.min(middleTarget, highlightTarget) +
				AUTOMATIC_BIAS_STOPS +
				compensationStops;
			const measuredIsoStops = quantizeStops(measuredStops);
			if (measuredIsoStops === targetStops) {
				unclampedTargetStops = measuredStops;
				pendingStops = undefined;
				return false;
			}
			if (measuredIsoStops !== pendingStops) {
				pendingStops = measuredIsoStops;
				pendingSince = now;
				return true;
			}
			if (now - pendingSince < ISO_DEBOUNCE_MILLISECONDS) return true;
			unclampedTargetStops = measuredStops;
			pendingStops = undefined;
			startTransition(measuredIsoStops);
			return false;
		},
		update: (input: ExposureSettings) => {
			if (input.automatic === automatic && input.stops === compensationStops) {
				return false;
			}
			const wasAutomatic = automatic;
			const compensationDelta = input.stops - compensationStops;
			automatic = input.automatic;
			compensationStops = input.stops;
			pendingStops = undefined;
			if (!automatic) {
				const manualStops = quantizeStops(input.stops);
				const targetChanged = manualStops !== targetStops;
				currentStops = manualStops;
				targetStops = manualStops;
				transitionStartStops = manualStops;
				transitionElapsed = ISO_TRANSITION_SECONDS;
				unclampedTargetStops = manualStops;
				if (targetChanged) onTargetChange(manualStops);
				return true;
			}
			if (wasAutomatic && compensationDelta !== 0) {
				unclampedTargetStops += compensationDelta;
				startTransition(unclampedTargetStops);
			}
			return true;
		},
		setReducedMotion: (reduced: boolean) => {
			reducedMotion = reduced;
		},
		advance: (deltaSeconds: number) => {
			if (transitionElapsed >= ISO_TRANSITION_SECONDS) return false;
			if (reducedMotion) {
				currentStops = targetStops;
				transitionElapsed = ISO_TRANSITION_SECONDS;
				return true;
			}
			transitionElapsed = Math.min(
				transitionElapsed + Math.max(deltaSeconds, 0),
				ISO_TRANSITION_SECONDS,
			);
			const progress = smootherStep(transitionElapsed / ISO_TRANSITION_SECONDS);
			currentStops =
				transitionStartStops + (targetStops - transitionStartStops) * progress;
			return true;
		},
	};
}
