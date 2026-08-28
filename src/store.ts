import {
	type CelestialBodies,
	type ObserverLocation,
	calculateCelestialBodies,
} from "@/lib/celestial-bodies";
import { create } from "zustand";

const INITIAL_TIMESTAMP = Date.UTC(2026, 7, 12, 18, 0);
export const ECLIPSE_PEAK_TIMESTAMP = Date.UTC(2026, 7, 12, 18, 29);

export const DEFAULT_OBSERVER_LOCATION: ObserverLocation = {
	latitude: 43,
	longitude: -5,
};

function calculateBodies(
	timestamp: number,
	observerLocation: ObserverLocation,
) {
	return calculateCelestialBodies({
		...observerLocation,
		timestamp: new Date(timestamp),
	});
}

type Store = {
	timestamp: number;
	observerLocation: ObserverLocation;
	bodies: CelestialBodies;
	effectiveExposureStops: number;
	frameRate: number | null;
	gpuTime: number | null;
	setTimestamp: (timestamp: number) => void;
	setObserverLocation: (location: ObserverLocation) => void;
	setEffectiveExposureStops: (stops: number) => void;
	setFrameRate: (frameRate: number) => void;
	setGpuTime: (gpuTime: number) => void;
};

const createEclipseStore = () =>
	create<Store>((set) => ({
		timestamp: INITIAL_TIMESTAMP,
		observerLocation: DEFAULT_OBSERVER_LOCATION,
		bodies: calculateBodies(INITIAL_TIMESTAMP, DEFAULT_OBSERVER_LOCATION),
		effectiveExposureStops: 0,
		frameRate: null,
		gpuTime: null,
		setTimestamp: (timestamp) =>
			set((state) => ({
				bodies: calculateBodies(timestamp, state.observerLocation),
				timestamp,
			})),
		setObserverLocation: (observerLocation) =>
			set((state) => ({
				bodies: calculateBodies(state.timestamp, observerLocation),
				observerLocation,
			})),
		setEffectiveExposureStops: (effectiveExposureStops) =>
			set({ effectiveExposureStops }),
		setFrameRate: (frameRate) => set({ frameRate }),
		setGpuTime: (gpuTime) => set({ gpuTime }),
	}));

const getEclipseStore = (): ReturnType<typeof createEclipseStore> => {
	if (!import.meta.hot) {
		return createEclipseStore();
	}

	import.meta.hot.data.store ??= createEclipseStore();
	return import.meta.hot.data.store;
};

export const useStore = getEclipseStore();
