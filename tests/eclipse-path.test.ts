import { describe, expect, test } from "bun:test";
import { getEclipseCenterPosition } from "../src/components/map/eclipse-path";

describe("getEclipseCenterPosition", () => {
	test("returns the sampled center at an exact timestamp", () => {
		expect(getEclipseCenterPosition(Date.UTC(2026, 7, 12, 17, 46))).toEqual([
			65 + 10.3 / 60,
			-(25 + 12.3 / 60),
		]);
	});

	test("hides the marker outside the central eclipse", () => {
		expect(getEclipseCenterPosition(Date.UTC(2026, 7, 12, 17))).toBeNull();
		expect(getEclipseCenterPosition(Date.UTC(2026, 7, 12, 18, 33))).toBeNull();
	});
});
