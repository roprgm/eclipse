import {
	clampCameraFocalLength,
	focalLengthToVerticalFov,
	getPinchCameraFocalLength,
	verticalFovToFocalLength,
} from "@/lib/camera";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

type DragState = {
	pitch: number;
	pointerId: number;
	x: number;
	y: number;
	yaw: number;
};

type PointerPosition = {
	x: number;
	y: number;
};

type PinchState = {
	distance: number;
	focalLength: number;
};

type ObserverControlsProps = {
	focalLength: number;
	onFocalLengthChange: (focalLength: number) => void;
};

function getPointerDistance(pointers: Map<number, PointerPosition>) {
	const [first, second] = [...pointers.values()];
	if (!first || !second) return 0;
	return Math.hypot(second.x - first.x, second.y - first.y);
}

export function ObserverControls({
	focalLength,
	onFocalLengthChange,
}: ObserverControlsProps) {
	const camera = useThree((state) => state.camera);
	const canvas = useThree((state) => state.gl.domElement);
	const invalidate = useThree((state) => state.invalidate);

	useEffect(() => {
		const fov = focalLengthToVerticalFov(focalLength);
		if (!(camera instanceof THREE.PerspectiveCamera) || camera.fov === fov) {
			return;
		}

		camera.fov = fov;
		camera.updateProjectionMatrix();
		invalidate();
	}, [camera, focalLength, invalidate]);

	useEffect(() => {
		if (!(camera instanceof THREE.PerspectiveCamera)) return;

		let drag: DragState | undefined;
		let pinch: PinchState | undefined;
		const pointers = new Map<number, PointerPosition>();
		canvas.style.cursor = "grab";
		canvas.style.touchAction = "none";

		const render = () => invalidate();
		const updateFocalLength = (nextFocalLength: number) => {
			const clampedFocalLength = clampCameraFocalLength(nextFocalLength);
			const nextFov = focalLengthToVerticalFov(clampedFocalLength);
			if (nextFov === camera.fov) return;

			camera.fov = nextFov;
			camera.updateProjectionMatrix();
			onFocalLengthChange(clampedFocalLength);
			render();
		};
		const startDrag = (pointerId: number, position: PointerPosition) => {
			const rotation = new THREE.Euler().setFromQuaternion(
				camera.quaternion,
				"YXZ",
			);
			drag = {
				pitch: rotation.x,
				pointerId,
				x: position.x,
				y: position.y,
				yaw: rotation.y,
			};
		};
		const startPinch = () => {
			pinch = {
				distance: getPointerDistance(pointers),
				focalLength: verticalFovToFocalLength(camera.fov),
			};
			drag = undefined;
		};
		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();
			const currentFocalLength = verticalFovToFocalLength(camera.fov);
			updateFocalLength(currentFocalLength * Math.exp(-event.deltaY * 0.001));
		};
		const handlePointerDown = (event: PointerEvent) => {
			if (event.button !== 0) return;

			const position = { x: event.clientX, y: event.clientY };
			pointers.set(event.pointerId, position);
			canvas.setPointerCapture(event.pointerId);
			if (pointers.size === 1) startDrag(event.pointerId, position);
			if (pointers.size === 2) startPinch();
			canvas.style.cursor = pointers.size > 1 ? "zoom-in" : "grabbing";
		};
		const handlePointerMove = (event: PointerEvent) => {
			if (!pointers.has(event.pointerId)) return;

			pointers.set(event.pointerId, {
				x: event.clientX,
				y: event.clientY,
			});
			if (pinch && pointers.size >= 2) {
				updateFocalLength(
					getPinchCameraFocalLength(
						pinch.focalLength,
						pinch.distance,
						getPointerDistance(pointers),
					),
				);
				return;
			}

			if (!drag || drag.pointerId !== event.pointerId) return;

			const verticalFov = THREE.MathUtils.degToRad(camera.fov);
			const horizontalFov =
				2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
			const pitch = THREE.MathUtils.clamp(
				drag.pitch +
					((event.clientY - drag.y) / canvas.clientHeight) * verticalFov,
				-Math.PI / 2 + 0.01,
				Math.PI / 2 - 0.01,
			);
			const yaw =
				drag.yaw +
				((event.clientX - drag.x) / canvas.clientWidth) * horizontalFov;
			camera.rotation.set(pitch, yaw, 0, "YXZ");
			render();
		};
		const handlePointerUp = (event: PointerEvent) => {
			if (!pointers.has(event.pointerId)) return;

			pointers.delete(event.pointerId);
			if (canvas.hasPointerCapture(event.pointerId)) {
				canvas.releasePointerCapture(event.pointerId);
			}
			pinch = undefined;
			if (pointers.size >= 2) startPinch();
			if (pointers.size === 1) {
				const [pointerId, position] = [...pointers.entries()][0];
				startDrag(pointerId, position);
			} else if (pointers.size === 0) {
				drag = undefined;
			}
			canvas.style.cursor = pointers.size > 0 ? "grabbing" : "grab";
		};

		canvas.addEventListener("pointerdown", handlePointerDown);
		canvas.addEventListener("pointermove", handlePointerMove);
		canvas.addEventListener("pointerup", handlePointerUp);
		canvas.addEventListener("pointercancel", handlePointerUp);
		canvas.addEventListener("wheel", handleWheel, { passive: false });

		return () => {
			canvas.removeEventListener("pointerdown", handlePointerDown);
			canvas.removeEventListener("pointermove", handlePointerMove);
			canvas.removeEventListener("pointerup", handlePointerUp);
			canvas.removeEventListener("pointercancel", handlePointerUp);
			canvas.removeEventListener("wheel", handleWheel);
		};
	}, [camera, canvas, invalidate, onFocalLengthChange]);

	return null;
}
