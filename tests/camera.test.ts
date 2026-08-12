import { describe, expect, test } from "bun:test";
import {
	MAX_CAMERA_FOCAL_LENGTH,
	MIN_CAMERA_FOCAL_LENGTH,
	clampCameraFocalLength,
	focalLengthToVerticalFov,
	getPinchCameraFocalLength,
} from "../src/lib/camera";

describe("camera focal length", () => {
	test("clamps focal length to the supported lens range", () => {
		expect(clampCameraFocalLength(0)).toBe(MIN_CAMERA_FOCAL_LENGTH);
		expect(clampCameraFocalLength(400)).toBe(MAX_CAMERA_FOCAL_LENGTH);
	});

	test("converts a full-frame focal length to vertical field of view", () => {
		expect(focalLengthToVerticalFov(18)).toBeCloseTo(67.38, 2);
		expect(focalLengthToVerticalFov(300)).toBeCloseTo(4.58, 2);
	});

	test("zooms in when fingers spread and out when they close", () => {
		expect(getPinchCameraFocalLength(50, 100, 200)).toBe(100);
		expect(getPinchCameraFocalLength(50, 100, 20)).toBe(
			MIN_CAMERA_FOCAL_LENGTH,
		);
	});
});
