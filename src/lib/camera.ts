const FULL_FRAME_SENSOR_HEIGHT_MM = 24;

export const DEFAULT_CAMERA_FOCAL_LENGTH = 33;
export const MIN_CAMERA_FOCAL_LENGTH = 18;
export const MAX_CAMERA_FOCAL_LENGTH = 300;

export function clampCameraFocalLength(focalLength: number) {
	return Math.min(
		MAX_CAMERA_FOCAL_LENGTH,
		Math.max(MIN_CAMERA_FOCAL_LENGTH, focalLength),
	);
}

export function focalLengthToVerticalFov(focalLength: number) {
	return (
		2 *
		Math.atan(FULL_FRAME_SENSOR_HEIGHT_MM / (2 * focalLength)) *
		(180 / Math.PI)
	);
}

export function verticalFovToFocalLength(fov: number) {
	return (
		FULL_FRAME_SENSOR_HEIGHT_MM / (2 * Math.tan((fov * Math.PI) / 180 / 2))
	);
}

export function getPinchCameraFocalLength(
	initialFocalLength: number,
	initialDistance: number,
	currentDistance: number,
) {
	if (initialDistance <= 0 || currentDistance <= 0) return initialFocalLength;
	return clampCameraFocalLength(
		initialFocalLength * (currentDistance / initialDistance),
	);
}
