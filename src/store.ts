import type {
	CelestialBodies,
	CelestialBodyState,
} from "@/lib/celestial-bodies";
import { create } from "zustand";

export type SelectedPoint = {
	latitude: number;
	longitude: number;
};

export const ECLIPSE_TIMESTAMP = Date.UTC(2026, 7, 12, 18, 29);
export const DEFAULT_POINT: SelectedPoint = { latitude: 42, longitude: 0 };

type Store = {
	timestamp: number;
	selectedPoint: SelectedPoint | null;
	sun: CelestialBodyState | null;
	moon: CelestialBodyState | null;
	setTimestamp: (timestamp: number) => void;
	setSelectedPoint: (point: SelectedPoint) => void;
	setBodies: (bodies: CelestialBodies) => void;
	clearBodies: () => void;
};

export const useStore = create<Store>((set) => ({
	timestamp: Date.UTC(2026, 7, 12, 18, 0),
	selectedPoint: DEFAULT_POINT,
	sun: null,
	moon: null,
	setTimestamp: (timestamp) => set({ timestamp }),
	setSelectedPoint: (selectedPoint) => set({ selectedPoint }),
	setBodies: ({ sun, moon }) => set({ sun, moon }),
	clearBodies: () => set({ sun: null, moon: null }),
}));
