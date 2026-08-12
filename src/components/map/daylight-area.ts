import * as Astronomy from "astronomy-engine";
import type { LatLngTuple } from "leaflet";

const MAP_LATITUDE_LIMIT = 85.05112878;
const SAMPLE_COUNT = 96;
const DEGREES_PER_HOUR = 15;

export type DaylightArea = {
	boundary: LatLngTuple[];
	centerLongitude: number;
};

function getDaylightHalfWidth(latitude: number, declination: number) {
	const hourAngleCosine =
		-Math.tan(latitude * Astronomy.DEG2RAD) *
		Math.tan(declination * Astronomy.DEG2RAD);

	if (hourAngleCosine <= -1) return 180;
	if (hourAngleCosine >= 1) return 0;

	return Math.acos(hourAngleCosine) * Astronomy.RAD2DEG;
}

export function getDaylightArea(timestamp: number): DaylightArea {
	const date = new Date(timestamp);
	const sun = Astronomy.Equator(
		Astronomy.Body.Sun,
		date,
		new Astronomy.Observer(0, 0, 0),
		true,
		true,
	);
	const centerLongitude =
		(sun.ra - Astronomy.SiderealTime(date)) * DEGREES_PER_HOUR;
	const latitudes = Array.from(
		{ length: SAMPLE_COUNT },
		(_, index) =>
			-MAP_LATITUDE_LIMIT +
			(index * MAP_LATITUDE_LIMIT * 2) / (SAMPLE_COUNT - 1),
	);
	const leftBoundary = latitudes.map(
		(latitude) =>
			[
				latitude,
				centerLongitude - getDaylightHalfWidth(latitude, sun.dec),
			] satisfies LatLngTuple,
	);
	const rightBoundary = latitudes.map(
		(latitude) =>
			[
				latitude,
				centerLongitude + getDaylightHalfWidth(latitude, sun.dec),
			] satisfies LatLngTuple,
	);

	return {
		boundary: [...leftBoundary, ...rightBoundary.reverse()],
		centerLongitude,
	};
}
