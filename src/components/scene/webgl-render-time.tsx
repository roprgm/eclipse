import { useStore } from "@/store";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { createRenderTimeReporter } from "./render-time";

type TimerExtension = {
	gpuDisjoint: number;
	timeElapsed: number;
};

type WebGlTimer = {
	begin: () => void;
	dispose: () => void;
	end: () => void;
};

function getTimerExtension(context: WebGL2RenderingContext) {
	const extension: unknown = context.getExtension(
		"EXT_disjoint_timer_query_webgl2",
	);
	if (typeof extension !== "object" || extension === null) return null;

	const gpuDisjoint = Reflect.get(extension, "GPU_DISJOINT_EXT");
	const timeElapsed = Reflect.get(extension, "TIME_ELAPSED_EXT");
	if (typeof gpuDisjoint !== "number" || typeof timeElapsed !== "number") {
		return null;
	}

	return { gpuDisjoint, timeElapsed } satisfies TimerExtension;
}

function createWebGlTimer(
	context: WebGLRenderingContext | WebGL2RenderingContext,
	onRenderTime: (milliseconds: number) => void,
): WebGlTimer | null {
	if (!(context instanceof WebGL2RenderingContext)) return null;
	const gl = context;
	const extension = getTimerExtension(gl);
	if (!extension) return null;
	const { gpuDisjoint, timeElapsed } = extension;

	let activeQuery: WebGLQuery | null = null;
	let pendingQuery: WebGLQuery | null = null;
	let pollFrame: number | null = null;

	function poll() {
		pollFrame = null;
		if (!pendingQuery) return;
		if (gl.isContextLost()) {
			gl.deleteQuery(pendingQuery);
			pendingQuery = null;
			return;
		}

		const available: unknown = gl.getQueryParameter(
			pendingQuery,
			gl.QUERY_RESULT_AVAILABLE,
		);
		if (available !== true) {
			pollFrame = requestAnimationFrame(poll);
			return;
		}

		const nanoseconds: unknown = gl.getQueryParameter(
			pendingQuery,
			gl.QUERY_RESULT,
		);
		const disjoint: unknown = gl.getParameter(gpuDisjoint);
		gl.deleteQuery(pendingQuery);
		pendingQuery = null;
		if (
			disjoint !== true &&
			typeof nanoseconds === "number" &&
			Number.isFinite(nanoseconds) &&
			nanoseconds > 0
		) {
			onRenderTime(nanoseconds / 1_000_000);
		}
	}

	return {
		begin: () => {
			if (activeQuery || pendingQuery) return;
			activeQuery = gl.createQuery();
			if (activeQuery) {
				gl.beginQuery(timeElapsed, activeQuery);
			}
		},
		dispose: () => {
			if (pollFrame !== null) cancelAnimationFrame(pollFrame);
			if (pendingQuery) gl.deleteQuery(pendingQuery);
			if (activeQuery) {
				gl.endQuery(timeElapsed);
				gl.deleteQuery(activeQuery);
			}
			activeQuery = null;
			pendingQuery = null;
		},
		end: () => {
			if (!activeQuery) return;
			gl.endQuery(timeElapsed);
			pendingQuery = activeQuery;
			activeQuery = null;
			pollFrame = requestAnimationFrame(poll);
		},
	};
}

export function WebGlRenderTime() {
	const context = useThree((state) => state.gl.getContext());
	const timer = useRef<WebGlTimer | null>(null);

	useEffect(() => {
		const report = createRenderTimeReporter((renderTime) =>
			useStore.getState().setRenderTime(renderTime),
		);
		const nextTimer = createWebGlTimer(context, report);
		timer.current = nextTimer;

		return () => {
			nextTimer?.dispose();
			if (timer.current === nextTimer) timer.current = null;
		};
	}, [context]);

	useFrame(() => timer.current?.begin(), -2);
	useFrame(() => timer.current?.end(), 2);

	return null;
}
