import {
	clampCameraFocalLength,
	focalLengthToTanHalfFov,
	getPinchCameraFocalLength,
} from "@/lib/camera";
import type { LocalDirection } from "@/lib/celestial-bodies";

const INITIAL_PITCH_OFFSET = (1.5 * Math.PI) / 180;
const PITCH_LIMIT = Math.PI / 2 - 0.01;

type Vector3 = readonly [number, number, number];

export type ObserverCameraView = {
	aspect: number;
	forward: Vector3;
	right: Vector3;
	tanHalfFov: number;
	up: Vector3;
};

type PointerPosition = {
	x: number;
	y: number;
};

type Drag = PointerPosition & {
	pitch: number;
	pointerId: number;
	yaw: number;
};

type Pinch = {
	distance: number;
	focalLength: number;
};

type ObserverCameraOptions = {
	focalLength: number;
	onViewChange: (view: ObserverCameraView) => void;
	onFocalLengthChange: (focalLength: number) => void;
};

function clampPitch(pitch: number) {
	return Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, pitch));
}

function pointerDistance(pointers: Map<number, PointerPosition>) {
	const [first, second] = pointers.values();
	if (!first || !second) return 0;
	return Math.hypot(second.x - first.x, second.y - first.y);
}

export function createObserverCamera(
	canvas: HTMLCanvasElement,
	options: ObserverCameraOptions,
) {
	let focalLength = clampCameraFocalLength(options.focalLength);
	let pitch = 0;
	let yaw = 0;
	let drag: Drag | undefined;
	let pinch: Pinch | undefined;
	const pointers = new Map<number, PointerPosition>();
	const events = new AbortController();
	const getView = (): ObserverCameraView => {
		const cosPitch = Math.cos(pitch);
		const sinPitch = Math.sin(pitch);
		const cosYaw = Math.cos(yaw);
		const sinYaw = Math.sin(yaw);
		return {
			aspect: canvas.clientWidth / Math.max(canvas.clientHeight, 1),
			forward: [-sinYaw * cosPitch, sinPitch, -cosYaw * cosPitch],
			right: [cosYaw, 0, -sinYaw],
			tanHalfFov: focalLengthToTanHalfFov(focalLength),
			up: [sinYaw * sinPitch, cosPitch, cosYaw * sinPitch],
		};
	};
	const emitView = () => options.onViewChange(getView());
	const applyFocalLength = (value: number) => {
		const next = clampCameraFocalLength(value);
		if (next === focalLength) return false;
		focalLength = next;
		return true;
	};
	const changeFocalLength = (value: number) => {
		if (!applyFocalLength(value)) return;
		options.onFocalLengthChange(focalLength);
		emitView();
	};
	const startDrag = () => {
		const [entry] = pointers.entries();
		if (!entry) return;
		const [pointerId, position] = entry;
		drag = { ...position, pitch, pointerId, yaw };
	};
	const startPinch = () => {
		pinch = { distance: pointerDistance(pointers), focalLength };
		drag = undefined;
	};
	const handleWheel = (event: WheelEvent) => {
		event.preventDefault();
		changeFocalLength(focalLength * Math.exp(-event.deltaY * 0.001));
	};
	const handlePointerDown = (event: PointerEvent) => {
		if (event.button !== 0) return;
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		canvas.setPointerCapture(event.pointerId);
		if (pointers.size === 1) startDrag();
		if (pointers.size === 2) startPinch();
		canvas.style.cursor = pointers.size > 1 ? "zoom-in" : "grabbing";
	};
	const handlePointerMove = (event: PointerEvent) => {
		if (!pointers.has(event.pointerId)) return;
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

		if (pinch && pointers.size >= 2) {
			changeFocalLength(
				getPinchCameraFocalLength(
					pinch.focalLength,
					pinch.distance,
					pointerDistance(pointers),
				),
			);
			return;
		}
		if (!drag || drag.pointerId !== event.pointerId) return;

		const currentView = getView();
		const verticalFov = 2 * Math.atan(currentView.tanHalfFov);
		const horizontalFov =
			2 * Math.atan(currentView.tanHalfFov * currentView.aspect);
		pitch = clampPitch(
			drag.pitch +
				((event.clientY - drag.y) / Math.max(canvas.clientHeight, 1)) *
					verticalFov,
		);
		yaw =
			drag.yaw +
			((event.clientX - drag.x) / Math.max(canvas.clientWidth, 1)) *
				horizontalFov;
		emitView();
	};
	const handlePointerUp = (event: PointerEvent) => {
		if (!pointers.delete(event.pointerId)) return;
		if (canvas.hasPointerCapture(event.pointerId)) {
			canvas.releasePointerCapture(event.pointerId);
		}
		pinch = undefined;
		if (pointers.size >= 2) startPinch();
		if (pointers.size === 1) startDrag();
		if (pointers.size === 0) drag = undefined;
		canvas.style.cursor = pointers.size > 0 ? "grabbing" : "grab";
	};

	canvas.style.cursor = "grab";
	canvas.style.touchAction = "none";
	const eventOptions = { signal: events.signal };
	canvas.addEventListener("pointerdown", handlePointerDown, eventOptions);
	canvas.addEventListener("pointermove", handlePointerMove, eventOptions);
	canvas.addEventListener("pointerup", handlePointerUp, eventOptions);
	canvas.addEventListener("pointercancel", handlePointerUp, eventOptions);
	canvas.addEventListener("wheel", handleWheel, {
		passive: false,
		...eventOptions,
	});

	return {
		dispose: () => {
			events.abort();
			canvas.style.cursor = "";
			canvas.style.touchAction = "";
		},
		setFocalLength: (value: number) => {
			if (applyFocalLength(value)) emitView();
		},
		setTarget: (direction: LocalDirection) => {
			const length = Math.hypot(direction.east, direction.north, direction.up);
			if (length === 0) return;
			pitch = clampPitch(
				Math.asin(direction.up / length) + INITIAL_PITCH_OFFSET,
			);
			yaw = Math.atan2(-direction.east, direction.north);
			emitView();
		},
		updateAspect: emitView,
	};
}
