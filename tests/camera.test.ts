import { describe, expect, test } from "bun:test";
import {
	MAX_CAMERA_FOCAL_LENGTH,
	MIN_CAMERA_FOCAL_LENGTH,
	clampCameraFocalLength,
	focalLengthToTanHalfFov,
	getPinchCameraFocalLength,
} from "../src/lib/camera";

describe("camera focal length", () => {
	test("clamps focal length to the supported lens range", () => {
		expect(clampCameraFocalLength(0)).toBe(MIN_CAMERA_FOCAL_LENGTH);
		expect(clampCameraFocalLength(400)).toBe(MAX_CAMERA_FOCAL_LENGTH);
	});

	test("converts focal length to the shader's half-FOV tangent", () => {
		expect(focalLengthToTanHalfFov(18)).toBeCloseTo(2 / 3, 12);
		expect(focalLengthToTanHalfFov(300)).toBeCloseTo(0.04, 12);
	});

	test("zooms in when fingers spread and out when they close", () => {
		expect(getPinchCameraFocalLength(50, 100, 200)).toBe(100);
		expect(getPinchCameraFocalLength(50, 100, 20)).toBe(
			MIN_CAMERA_FOCAL_LENGTH,
		);
	});
});
