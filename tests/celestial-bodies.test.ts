import { describe, expect, test } from "bun:test";
import { calculateCelestialBodies } from "../src/lib/celestial-bodies";

describe("calculateCelestialBodies", () => {
	test("returns finite directions and angular radii for the Sun and Moon", () => {
		const bodies = calculateCelestialBodies({
			latitude: 59.437,
			longitude: 24.7536,
			timestamp: new Date("2026-08-12T18:42:00.000Z"),
		});

		for (const body of [bodies.sun, bodies.moon]) {
			expect(Number.isFinite(body.azimuthRad)).toBe(true);
			expect(Number.isFinite(body.altitudeRad)).toBe(true);
			expect(Number.isFinite(body.angularRadiusRad)).toBe(true);
			expect(Number.isFinite(body.distanceKm)).toBe(true);
			expect(body.angularRadiusRad).toBeGreaterThan(0);
			expect(body.distanceKm).toBeGreaterThan(0);

			const { east, north, up } = body.directionEnu;
			expect(Number.isFinite(east)).toBe(true);
			expect(Number.isFinite(north)).toBe(true);
			expect(Number.isFinite(up)).toBe(true);
			expect(Math.hypot(east, north, up)).toBeCloseTo(1, 12);
		}
	});

	test("rejects invalid observer coordinates and timestamps", () => {
		const validInput = {
			latitude: 0,
			longitude: 0,
			timestamp: new Date("2026-08-12T18:42:00.000Z"),
		};

		expect(() =>
			calculateCelestialBodies({ ...validInput, latitude: 91 }),
		).toThrow(RangeError);
		expect(() =>
			calculateCelestialBodies({ ...validInput, longitude: -181 }),
		).toThrow(RangeError);
		expect(() =>
			calculateCelestialBodies({
				...validInput,
				timestamp: new Date(Number.NaN),
			}),
		).toThrow(RangeError);
	});
});
