import type { LatLngTuple } from "leaflet";

type LongitudeDirection = "E" | "W";
type RawCoordinate = readonly [
	latitudeDegrees: number,
	latitudeMinutes: number,
	longitudeDegrees: number,
	longitudeMinutes: number,
	longitudeDirection: LongitudeDirection,
];

export const ECLIPSE_PATH_SOURCE =
	"https://eclipse.gsfc.nasa.gov/SEpath/SEpath2001/SE2026Aug12Tpath.html";

const CENTER_LINE_START = Date.UTC(2026, 7, 12, 17, 2);
const CENTER_LINE_STEP = 2 * 60_000;

function toLatLng([
	latitudeDegrees,
	latitudeMinutes,
	longitudeDegrees,
	longitudeMinutes,
	longitudeDirection,
]: RawCoordinate): LatLngTuple {
	const longitude = longitudeDegrees + longitudeMinutes / 60;

	return [
		latitudeDegrees + latitudeMinutes / 60,
		longitudeDirection === "W" ? -longitude : longitude,
	];
}

// NASA/GSFC WGS 84 limits sampled at two-minute intervals.
export const TOTALITY_NORTH_LIMIT = (
	[
		[75, 10.4, 108, 41.4, "E"],
		[75, 56.2, 108, 45.5, "E"],
		[82, 9.8, 103, 13, "E"],
		[84, 51, 90, 23.7, "E"],
		[86, 20.6, 65, 49.4, "E"],
		[86, 32.7, 32, 43.7, "E"],
		[85, 43.2, 8, 22.5, "E"],
		[84, 28.9, 4, 48.6, "W"],
		[83, 7.9, 12, 0.1, "W"],
		[81, 46.5, 16, 13, "W"],
		[80, 26.5, 18, 50.5, "W"],
		[79, 8.5, 20, 32.3, "W"],
		[77, 52.5, 21, 39.4, "W"],
		[76, 38.5, 22, 23.6, "W"],
		[75, 26.4, 22, 51.9, "W"],
		[74, 16, 23, 8.7, "W"],
		[73, 7, 23, 17.1, "W"],
		[71, 59.5, 23, 18.8, "W"],
		[70, 53.1, 23, 15.5, "W"],
		[69, 47.9, 23, 7.9, "W"],
		[68, 43.6, 22, 56.9, "W"],
		[67, 40.2, 22, 42.8, "W"],
		[66, 37.6, 22, 26.2, "W"],
		[65, 35.6, 22, 7.2, "W"],
		[64, 34.3, 21, 46.1, "W"],
		[63, 33.4, 21, 22.9, "W"],
		[62, 32.9, 20, 57.7, "W"],
		[61, 32.8, 20, 30.5, "W"],
		[60, 32.9, 20, 1.3, "W"],
		[59, 33.2, 19, 30, "W"],
		[58, 33.6, 18, 56.6, "W"],
		[57, 33.9, 18, 20.9, "W"],
		[56, 34.1, 17, 42.7, "W"],
		[55, 34.1, 17, 1.7, "W"],
		[54, 33.7, 16, 17.7, "W"],
		[53, 32.8, 15, 30.2, "W"],
		[52, 31.2, 14, 38.8, "W"],
		[51, 28.7, 13, 42.7, "W"],
		[50, 25, 12, 41.1, "W"],
		[49, 19.8, 11, 32.8, "W"],
		[48, 12.5, 10, 16, "W"],
		[47, 2.3, 8, 48.1, "W"],
		[45, 48.1, 7, 4.6, "W"],
		[44, 27.4, 4, 56.9, "W"],
		[42, 54.5, 2, 5.1, "W"],
		[40, 39.9, 3, 17.7, "E"],
		[39, 42.5, 6, 20.4, "E"],
	] satisfies RawCoordinate[]
).map(toLatLng);

export const TOTALITY_SOUTH_LIMIT = (
	[
		[74, 54.8, 117, 57.6, "E"],
		[85, 19.3, 119, 25.4, "E"],
		[87, 45.2, 108, 25.9, "E"],
		[89, 4, 38, 8.9, "E"],
		[87, 47.3, 19, 30.4, "W"],
		[86, 8.5, 29, 13, "W"],
		[84, 33.9, 32, 14.8, "W"],
		[83, 4.3, 33, 25, "W"],
		[81, 39, 33, 50.3, "W"],
		[80, 17.5, 33, 53.8, "W"],
		[78, 59.2, 33, 45.6, "W"],
		[77, 43.6, 33, 30.3, "W"],
		[76, 30.4, 33, 10.7, "W"],
		[75, 19.4, 32, 48.3, "W"],
		[74, 10.1, 32, 24, "W"],
		[73, 2.6, 31, 58.3, "W"],
		[71, 56.4, 31, 31.6, "W"],
		[70, 51.6, 31, 4.1, "W"],
		[69, 47.8, 30, 36, "W"],
		[68, 45.2, 30, 7.2, "W"],
		[67, 43.4, 29, 37.9, "W"],
		[66, 42.4, 29, 8, "W"],
		[65, 42.2, 28, 37.5, "W"],
		[64, 42.6, 28, 6.4, "W"],
		[63, 43.6, 27, 34.6, "W"],
		[62, 45, 27, 2, "W"],
		[61, 46.8, 26, 28.6, "W"],
		[60, 49, 25, 54.3, "W"],
		[59, 51.4, 25, 19, "W"],
		[58, 54, 24, 42.4, "W"],
		[57, 56.7, 24, 4.6, "W"],
		[56, 59.4, 23, 25.3, "W"],
		[56, 2.2, 22, 44.3, "W"],
		[55, 4.7, 22, 1.5, "W"],
		[54, 7.1, 21, 16.5, "W"],
		[53, 9.1, 20, 29.1, "W"],
		[52, 10.6, 19, 38.8, "W"],
		[51, 11.6, 18, 45.3, "W"],
		[50, 11.7, 17, 47.9, "W"],
		[49, 10.9, 16, 45.9, "W"],
		[48, 8.8, 15, 38.3, "W"],
		[47, 5, 14, 23.8, "W"],
		[45, 59, 13, 0.5, "W"],
		[44, 49.9, 11, 25.2, "W"],
		[43, 36.4, 9, 33.1, "W"],
		[42, 15.8, 7, 14.2, "W"],
		[40, 41, 4, 2.4, "W"],
		[37, 41.4, 4, 32.4, "E"],
	] satisfies RawCoordinate[]
).map(toLatLng);

export const TOTALITY_CENTER_LINE = (
	[
		[75, 4.7, 113, 27.1, "E"],
		[82, 16.5, 112, 29.2, "E"],
		[85, 17.7, 104, 12.9, "E"],
		[87, 16.7, 81, 31.5, "E"],
		[87, 49.4, 33, 0, "E"],
		[86, 50.1, 1, 38.3, "W"],
		[85, 24.2, 15, 10.9, "W"],
		[83, 55.9, 21, 11.2, "W"],
		[82, 29.7, 24, 16.3, "W"],
		[81, 6.6, 25, 59.5, "W"],
		[79, 46.4, 26, 58.9, "W"],
		[78, 29, 27, 32.4, "W"],
		[77, 14, 27, 49.5, "W"],
		[76, 1.1, 27, 55.7, "W"],
		[74, 50.2, 27, 54.3, "W"],
		[73, 41, 27, 47.3, "W"],
		[72, 33.4, 27, 36.2, "W"],
		[71, 27, 27, 21.7, "W"],
		[70, 21.9, 27, 4.7, "W"],
		[69, 17.9, 26, 45.6, "W"],
		[68, 14.8, 26, 24.6, "W"],
		[67, 12.6, 26, 1.9, "W"],
		[66, 11.1, 25, 37.8, "W"],
		[65, 10.3, 25, 12.3, "W"],
		[64, 10.1, 24, 45.4, "W"],
		[63, 10.3, 24, 17.2, "W"],
		[62, 11, 23, 47.6, "W"],
		[61, 12, 23, 16.6, "W"],
		[60, 13.3, 22, 44.2, "W"],
		[59, 14.7, 22, 10.2, "W"],
		[58, 16.3, 21, 34.4, "W"],
		[57, 17.8, 20, 56.8, "W"],
		[56, 19.3, 20, 17.2, "W"],
		[55, 20.6, 19, 35.3, "W"],
		[54, 21.7, 18, 50.8, "W"],
		[53, 22.3, 18, 3.4, "W"],
		[52, 22.3, 17, 12.7, "W"],
		[51, 21.6, 16, 18.2, "W"],
		[50, 20, 15, 19, "W"],
		[49, 17.1, 14, 14.3, "W"],
		[48, 12.7, 13, 2.9, "W"],
		[47, 6.1, 11, 42.9, "W"],
		[45, 56.6, 10, 11.4, "W"],
		[44, 42.8, 8, 23.9, "W"],
		[43, 22.3, 6, 11.3, "W"],
		[41, 49, 3, 11.1, "W"],
		[39, 24.5, 2, 57, "E"],
		[38, 40.8, 5, 24.9, "E"],
	] satisfies RawCoordinate[]
).map(toLatLng);

export const TOTALITY_AREA = [
	...TOTALITY_NORTH_LIMIT,
	...[...TOTALITY_SOUTH_LIMIT].reverse(),
];

const TIMED_CENTER_LINE = TOTALITY_CENTER_LINE.slice(1, -1);
const CENTER_LINE_END =
	CENTER_LINE_START + (TIMED_CENTER_LINE.length - 1) * CENTER_LINE_STEP;

export function getEclipseCenterPosition(
	timestamp: number,
): LatLngTuple | null {
	if (
		!Number.isFinite(timestamp) ||
		timestamp < CENTER_LINE_START ||
		timestamp > CENTER_LINE_END
	) {
		return null;
	}

	const offset = (timestamp - CENTER_LINE_START) / CENTER_LINE_STEP;
	const currentIndex = Math.floor(offset);
	const nextIndex = Math.min(currentIndex + 1, TIMED_CENTER_LINE.length - 1);
	const progress = offset - currentIndex;
	const current = TIMED_CENTER_LINE[currentIndex];
	const next = TIMED_CENTER_LINE[nextIndex];

	return [
		current[0] + (next[0] - current[0]) * progress,
		current[1] + (next[1] - current[1]) * progress,
	];
}
