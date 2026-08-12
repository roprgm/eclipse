import { useStore } from "@/store";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

const UPDATE_INTERVAL_MILLISECONDS = 500;
const INACTIVITY_THRESHOLD_MILLISECONDS = 100;

type FrameRateRuntime = {
	frames: number;
	lastFrameTime: number | null;
	lastSampleTime: number | null;
};

export function FrameRate() {
	const runtime = useRef<FrameRateRuntime>({
		frames: 0,
		lastFrameTime: null,
		lastSampleTime: null,
	});

	useFrame(() => {
		const state = runtime.current;
		const now = performance.now();
		const lastFrameTime = state.lastFrameTime;
		const lastSampleTime = state.lastSampleTime;

		if (
			lastFrameTime === null ||
			lastSampleTime === null ||
			now - lastFrameTime >= INACTIVITY_THRESHOLD_MILLISECONDS
		) {
			state.frames = 0;
			state.lastFrameTime = now;
			state.lastSampleTime = now;
			return;
		}

		state.lastFrameTime = now;
		state.frames += 1;
		const elapsed = now - lastSampleTime;
		if (elapsed < UPDATE_INTERVAL_MILLISECONDS) return;

		useStore
			.getState()
			.setFrameRate(Math.round((state.frames * 1000) / elapsed));
		state.frames = 0;
		state.lastSampleTime = now;
	});

	return null;
}
