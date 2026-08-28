import { describe, expect, test } from "bun:test";
import { toRenderDirection } from "../src/components/scene/render-direction";
import { toLocalDirection } from "../src/lib/celestial-bodies";

describe("local directions in renderer coordinates", () => {
	test("maps north, east, and zenith to the renderer axes", () => {
		const cases = [
			[0, 0, [0, 0, -1]],
			[90, 0, [1, 0, 0]],
			[0, 90, [0, 1, 0]],
		] as const;

		for (const [azimuth, altitude, expected] of cases) {
			const local = toLocalDirection(
				(azimuth * Math.PI) / 180,
				(altitude * Math.PI) / 180,
			);
			const direction = toRenderDirection(local);
			direction.forEach((value, index) =>
				expect(value).toBeCloseTo(expected[index], 12),
			);
		}
	});
});
