import { describe, expect, test } from "bun:test";
import { getDaylightArea } from "../src/components/map/daylight-area";

function getEasternBoundaryLongitude(timestamp: number, latitude: number) {
	const { boundary } = getDaylightArea(timestamp);
	const easternBoundary = boundary.slice(boundary.length / 2).reverse();
	const upperIndex = easternBoundary.findIndex(
		([sampleLatitude]) => sampleLatitude >= latitude,
	);
	if (upperIndex <= 0) throw new Error("Latitude is outside the sampled area");

	const [lowerLatitude, lowerLongitude] = easternBoundary[upperIndex - 1];
	const [upperLatitude, upperLongitude] = easternBoundary[upperIndex];
	const progress = (latitude - lowerLatitude) / (upperLatitude - lowerLatitude);
	return lowerLongitude + (upperLongitude - lowerLongitude) * progress;
}

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

	test("keeps Tallinn in daylight while the refracted Sun is still visible", () => {
		const latitude = 59.437;
		const longitude = 24.7536;

		expect(
			getEasternBoundaryLongitude(Date.UTC(2026, 7, 12, 18, 15), latitude),
		).toBeGreaterThan(longitude);
		expect(
			getEasternBoundaryLongitude(Date.UTC(2026, 7, 12, 18, 30), latitude),
		).toBeLessThan(longitude);
	});
});
