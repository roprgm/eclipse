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

export function ObserverControls() {
	const camera = useThree((state) => state.camera);
	const canvas = useThree((state) => state.gl.domElement);
	const invalidate = useThree((state) => state.invalidate);

	useEffect(() => {
		if (!(camera instanceof THREE.PerspectiveCamera)) return;

		let drag: DragState | undefined;
		canvas.style.cursor = "grab";
		canvas.style.touchAction = "none";

		const render = () => invalidate();
		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();
			const nextFov = THREE.MathUtils.clamp(
				camera.fov + event.deltaY * 0.02,
				5,
				75,
			);
			if (nextFov === camera.fov) return;

			camera.fov = nextFov;
			camera.updateProjectionMatrix();
			render();
		};
		const handlePointerDown = (event: PointerEvent) => {
			if (!event.isPrimary || event.button !== 0) return;

			const rotation = new THREE.Euler().setFromQuaternion(
				camera.quaternion,
				"YXZ",
			);
			drag = {
				pitch: rotation.x,
				pointerId: event.pointerId,
				x: event.clientX,
				y: event.clientY,
				yaw: rotation.y,
			};
			canvas.setPointerCapture(event.pointerId);
			canvas.style.cursor = "grabbing";
		};
		const handlePointerMove = (event: PointerEvent) => {
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
			if (!drag || drag.pointerId !== event.pointerId) return;

			drag = undefined;
			if (canvas.hasPointerCapture(event.pointerId)) {
				canvas.releasePointerCapture(event.pointerId);
			}
			canvas.style.cursor = "grab";
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
	}, [camera, canvas, invalidate]);

	return null;
}
