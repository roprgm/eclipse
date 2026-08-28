import {
	type CelestialBodies,
	type ObserverLocation,
	calculateCelestialBodies,
} from "@/lib/celestial-bodies";
import { ECLIPSES, type SolarEclipse } from "@/lib/eclipses";
import { create } from "zustand";

const INITIAL_ECLIPSE = ECLIPSES[0];

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
	eclipse: SolarEclipse;
	timestamp: number;
	observerLocation: ObserverLocation;
	bodies: CelestialBodies;
	effectiveExposureStops: number;
	frameRate: number | null;
	gpuTime: number | null;
	selectEclipse: (eclipse: SolarEclipse) => void;
	setTimestamp: (timestamp: number) => void;
	setObserverLocation: (location: ObserverLocation) => void;
	setEffectiveExposureStops: (stops: number) => void;
	setFrameRate: (frameRate: number) => void;
	setGpuTime: (gpuTime: number) => void;
};

const createEclipseStore = () =>
	create<Store>((set) => ({
		eclipse: INITIAL_ECLIPSE,
		timestamp: INITIAL_ECLIPSE.initialTimestamp,
		observerLocation: INITIAL_ECLIPSE.defaultLocation,
		bodies: calculateBodies(
			INITIAL_ECLIPSE.initialTimestamp,
			INITIAL_ECLIPSE.defaultLocation,
		),
		effectiveExposureStops: 0,
		frameRate: null,
		gpuTime: null,
		selectEclipse: (eclipse) =>
			set({
				bodies: calculateBodies(
					eclipse.initialTimestamp,
					eclipse.defaultLocation,
				),
				eclipse,
				observerLocation: eclipse.defaultLocation,
				timestamp: eclipse.initialTimestamp,
			}),
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
