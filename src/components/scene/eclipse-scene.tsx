import { useStore } from "@/store";
import { useEffect, useRef, useState } from "react";
import {
	type EclipseRenderer,
	type EclipseRendererInput,
	createEclipseRenderer,
} from "./eclipse-renderer";

type EclipseSceneProps = {
	autoExposure: boolean;
	cameraFocalLength: number;
	exposureStops: number;
	onCameraFocalLengthChange: (focalLength: number) => void;
};

type RendererStatus =
	| { kind: "loading" }
	| { kind: "ready" }
	| { detail: string; kind: "error" };

function getErrorMessage(error: unknown) {
	if (error instanceof Error) return error.message;
	return String(error);
}

function RendererStatusOverlay({ status }: { status: RendererStatus }) {
	if (status.kind === "ready") return null;
	if (status.kind === "loading") {
		return (
			<output className="pointer-events-none absolute inset-0 grid place-items-center bg-[#071426] text-sm text-white/70">
				<div className="grid justify-items-center gap-3">
					<span aria-hidden="true" className="app-loading-spinner" />
					Initializing WebGPU…
				</div>
			</output>
		);
	}

	return (
		<div
			className="absolute inset-0 grid place-items-center bg-[#071426] p-8 text-center text-sm text-white/80"
			role="alert"
		>
			<div className="max-w-md">
				<p className="text-white">WebGPU renderer failed.</p>
				<p className="mt-2 text-white/55">{status.detail}</p>
			</div>
		</div>
	);
}

export function EclipseScene({
	autoExposure,
	cameraFocalLength,
	exposureStops,
	onCameraFocalLengthChange,
}: EclipseSceneProps) {
	const bodies = useStore((state) => state.bodies);
	const peakTimestamp = useStore((state) => state.eclipse.peakTimestamp);
	const observerLocation = useStore((state) => state.observerLocation);
	const [status, setStatus] = useState<RendererStatus>({ kind: "loading" });
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rendererRef = useRef<EclipseRenderer>(null);
	const focalLengthHandlerRef = useRef(onCameraFocalLengthChange);
	focalLengthHandlerRef.current = onCameraFocalLengthChange;
	const rendererInput: EclipseRendererInput = {
		autoExposure,
		bodies,
		cameraFocalLength,
		exposureStops,
		observerLocation,
		peakTimestamp,
	};
	const latestInputRef = useRef(rendererInput);
	latestInputRef.current = rendererInput;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		let isMounted = true;
		const handleError = (error: unknown) => {
			if (!isMounted) return;
			console.error("WebGPU renderer failed", error);
			setStatus({ detail: getErrorMessage(error), kind: "error" });
		};
		void createEclipseRenderer(canvas, latestInputRef.current, {
			onEffectiveExposureChange: (stops) =>
				useStore.getState().setEffectiveExposureStops(stops),
			onError: handleError,
			onCameraFocalLengthChange: (focalLength) =>
				focalLengthHandlerRef.current(focalLength),
			onFrameRate: (frameRate) => useStore.getState().setFrameRate(frameRate),
			onGpuTime: (gpuTime) => useStore.getState().setGpuTime(gpuTime),
			onReady: () => setStatus({ kind: "ready" }),
		})
			.then((renderer) => {
				if (!isMounted) {
					renderer.dispose();
					return;
				}
				rendererRef.current = renderer;
				renderer.update(latestInputRef.current);
			})
			.catch(handleError);

		return () => {
			isMounted = false;
			rendererRef.current?.dispose();
			rendererRef.current = null;
		};
	}, []);

	useEffect(() => {
		rendererRef.current?.update(latestInputRef.current);
	});

	return (
		<>
			<canvas
				aria-label="Interactive eclipse view"
				className="block size-full bg-[#071426]"
				data-renderer-status={status.kind}
				ref={canvasRef}
			/>
			<RendererStatusOverlay status={status} />
		</>
	);
}
