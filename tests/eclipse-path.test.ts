import { describe, expect, test } from "bun:test";
import { ECLIPSES, getEclipseCenterPosition } from "../src/lib/eclipses";

const path = ECLIPSES[0].path;

describe("getEclipseCenterPosition", () => {
	test("returns the sampled center at an exact timestamp", () => {
		expect(
			getEclipseCenterPosition(path, Date.UTC(2026, 7, 12, 17, 46)),
		).toEqual([65.1717, -25.205]);
	});

	test("hides the marker outside the central eclipse", () => {
		expect(
			getEclipseCenterPosition(path, Date.UTC(2026, 7, 12, 17)),
		).toBeNull();
		expect(
			getEclipseCenterPosition(path, Date.UTC(2026, 7, 12, 18, 33)),
		).toBeNull();
	});
});
