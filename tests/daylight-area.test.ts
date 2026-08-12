import { describe, expect, test } from "bun:test";
import { getDaylightArea } from "../src/components/map/daylight-area";

describe("getDaylightArea", () => {
	test("includes the summer polar day and excludes the winter polar night", () => {
		const { boundary } = getDaylightArea(Date.UTC(2026, 5, 21, 12));
		const northernEdge = boundary.filter(([latitude]) => latitude > 80);
		const southernEdge = boundary.filter(([latitude]) => latitude < -80);

		const northernLongitudes = northernEdge.map(([, longitude]) => longitude);
		const southernLongitudes = southernEdge.map(([, longitude]) => longitude);

		expect(
			Math.max(...northernLongitudes) - Math.min(...northernLongitudes),
		).toBeCloseTo(360, 8);
		expect(
			Math.max(...southernLongitudes) - Math.min(...southernLongitudes),
		).toBeCloseTo(0, 8);
	});
});
