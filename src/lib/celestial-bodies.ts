import * as Astronomy from "astronomy-engine";

const KM_PER_AU = 149_597_870.7;
const SUN_RADIUS_KM = 695_700;
const MOON_RADIUS_KM = 1_737.4;

export type CelestialInput = {
	latitude: number;
	longitude: number;
	timestamp: Date;
};

export type LocalDirection = {
	east: number;
	north: number;
	up: number;
};

export type CelestialBodyState = {
	altitudeRad: number;
	angularRadiusRad: number;
	azimuthRad: number;
	directionEnu: LocalDirection;
	distanceKm: number;
};

export type CelestialBodies = {
	sun: CelestialBodyState;
	moon: CelestialBodyState;
};

function validateInput({ latitude, longitude, timestamp }: CelestialInput) {
	if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
		throw new RangeError("Latitude must be between -90 and 90 degrees");
	}

	if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
		throw new RangeError("Longitude must be between -180 and 180 degrees");
	}

	if (!(timestamp instanceof Date) || Number.isNaN(timestamp.getTime())) {
		throw new RangeError("Timestamp must be a valid Date");
	}
}

export function toLocalDirection(
	azimuthRad: number,
	altitudeRad: number,
): LocalDirection {
	const horizontalLength = Math.cos(altitudeRad);

	return {
		east: horizontalLength * Math.sin(azimuthRad),
		north: horizontalLength * Math.cos(azimuthRad),
		up: Math.sin(altitudeRad),
	};
}

function calculateBodyState(
	body: Astronomy.Body.Sun | Astronomy.Body.Moon,
	bodyRadiusKm: number,
	timestamp: Date,
	observer: Astronomy.Observer,
): CelestialBodyState {
	const equatorial = Astronomy.Equator(body, timestamp, observer, true, true);
	const horizontal = Astronomy.Horizon(
		timestamp,
		observer,
		equatorial.ra,
		equatorial.dec,
		"normal",
	);
	const azimuthRad = horizontal.azimuth * Astronomy.DEG2RAD;
	const altitudeRad = horizontal.altitude * Astronomy.DEG2RAD;
	const distanceKm = equatorial.dist * KM_PER_AU;

	return {
		altitudeRad,
		angularRadiusRad: Math.asin(bodyRadiusKm / distanceKm),
		azimuthRad,
		directionEnu: toLocalDirection(azimuthRad, altitudeRad),
		distanceKm,
	};
}

function discOverlap(
	firstRadius: number,
	secondRadius: number,
	distance: number,
) {
	if (distance >= firstRadius + secondRadius) return 0;
	if (distance <= Math.abs(firstRadius - secondRadius)) {
		return firstRadius <= secondRadius ? 1 : (secondRadius / firstRadius) ** 2;
	}

	const x =
		(firstRadius ** 2 - secondRadius ** 2 + distance ** 2) / (2 * distance);
	const y = Math.sqrt(firstRadius ** 2 - x ** 2);
	const overlap =
		firstRadius ** 2 * Math.acos(x / firstRadius) -
		x * y +
		secondRadius ** 2 * Math.acos((distance - x) / secondRadius) -
		(distance - x) * y;

	return overlap / (Math.PI * firstRadius ** 2);
}

export function calculateSolarCoverage(
	sun: CelestialBodyState,
	moon: CelestialBodyState,
) {
	const dotProduct =
		sun.directionEnu.east * moon.directionEnu.east +
		sun.directionEnu.north * moon.directionEnu.north +
		sun.directionEnu.up * moon.directionEnu.up;
	const separation = Math.acos(Math.min(1, Math.max(-1, dotProduct)));

	return discOverlap(sun.angularRadiusRad, moon.angularRadiusRad, separation);
}

export function calculateCelestialBodies({
	latitude,
	longitude,
	timestamp,
}: CelestialInput): CelestialBodies {
	validateInput({ latitude, longitude, timestamp });

	const observer = new Astronomy.Observer(latitude, longitude, 0);

	return {
		sun: calculateBodyState(
			Astronomy.Body.Sun,
			SUN_RADIUS_KM,
			timestamp,
			observer,
		),
		moon: calculateBodyState(
			Astronomy.Body.Moon,
			MOON_RADIUS_KM,
			timestamp,
			observer,
		),
	};
}
