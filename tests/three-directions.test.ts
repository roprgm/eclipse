import { describe, expect, test } from "bun:test";
import * as THREE from "three";
import { toThreeDirection } from "../src/components/scene/three-directions";
import { toLocalDirection } from "../src/lib/celestial-bodies";

const DEG_TO_RAD = Math.PI / 180;

function expectDirection(
	azimuthDeg: number,
	altitudeDeg: number,
	expected: [number, number, number],
) {
	const directionEnu = toLocalDirection(
		azimuthDeg * DEG_TO_RAD,
		altitudeDeg * DEG_TO_RAD,
	);
	const direction = toThreeDirection(directionEnu, new THREE.Vector3());

	expect(direction.x).toBeCloseTo(expected[0], 12);
	expect(direction.y).toBeCloseTo(expected[1], 12);
	expect(direction.z).toBeCloseTo(expected[2], 12);
}

describe("local directions in Three.js coordinates", () => {
	test("north at the horizon points along negative Z", () => {
		expectDirection(0, 0, [0, 0, -1]);
	});

	test("east at the horizon points along positive X", () => {
		expectDirection(90, 0, [1, 0, 0]);
	});

	test("the zenith points along positive Y", () => {
		expectDirection(0, 90, [0, 1, 0]);
	});
});
