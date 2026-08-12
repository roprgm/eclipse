import {
	type CelestialBodyState,
	calculateSolarCoverage,
} from "@/lib/celestial-bodies";
import { useMemo } from "react";
import * as THREE from "three";
import { createSolarFrame } from "./solar-frame";

const GLARE_RADIUS = 0.008;
const GLARE_SOFTENING = 0.00008;
const GLARE_SCATTER = 1.5e-4;
const TIP_ENERGY_FLOOR = 0.03;
const CORNER_COUNT = 6;

function circleIntersections(
	firstCenter: THREE.Vector2,
	firstRadius: number,
	secondCenter: THREE.Vector2,
	secondRadius: number,
) {
	const offset = secondCenter.clone().sub(firstCenter);
	const distance = offset.length();
	if (
		distance === 0 ||
		distance > firstRadius + secondRadius ||
		distance < Math.abs(firstRadius - secondRadius)
	) {
		return [];
	}

	const along =
		(firstRadius ** 2 - secondRadius ** 2 + distance ** 2) / (2 * distance);
	const across = Math.sqrt(Math.max(0, firstRadius ** 2 - along ** 2));
	const direction = offset.divideScalar(distance);
	const center = firstCenter.clone().addScaledVector(direction, along);
	const perpendicular = new THREE.Vector2(
		-direction.y,
		direction.x,
	).multiplyScalar(across);
	return [center.clone().add(perpendicular), center.sub(perpendicular)];
}

function circleLineIntersections(
	center: THREE.Vector2,
	radius: number,
	normal: THREE.Vector2,
	offset: number,
) {
	const normalLength = normal.length();
	if (normalLength === 0) return [];

	const unitNormal = normal.clone().divideScalar(normalLength);
	const signedDistance = (normal.dot(center) + offset) / normalLength;
	if (Math.abs(signedDistance) > radius) return [];

	const middle = center.clone().addScaledVector(unitNormal, -signedDistance);
	const halfLength = Math.sqrt(Math.max(0, radius ** 2 - signedDistance ** 2));
	const tangent = new THREE.Vector2(-unitNormal.y, unitNormal.x).multiplyScalar(
		halfLength,
	);
	return [middle.clone().add(tangent), middle.sub(tangent)];
}

function isVisibleSource(
	point: THREE.Vector2,
	sunRadius: number,
	moonCenter: THREE.Vector2,
	moonRadius: number,
	horizon: THREE.Vector3,
) {
	const epsilon = 1e-8;
	return (
		point.length() <= sunRadius + epsilon &&
		point.distanceTo(moonCenter) >= moonRadius - epsilon &&
		horizon.x * point.x + horizon.y * point.y + horizon.z >= -epsilon
	);
}

function createCorners(
	sunRadius: number,
	moonCenter: THREE.Vector2,
	moonRadius: number,
	horizon: THREE.Vector3,
) {
	const origin = new THREE.Vector2();
	const normal = new THREE.Vector2(horizon.x, horizon.y);
	const corners = [
		...circleIntersections(origin, sunRadius, moonCenter, moonRadius),
		...circleLineIntersections(origin, sunRadius, normal, horizon.z),
		...circleLineIntersections(moonCenter, moonRadius, normal, horizon.z),
	].filter((point) =>
		isVisibleSource(point, sunRadius, moonCenter, moonRadius, horizon),
	);
	const count = corners.length;
	while (corners.length < CORNER_COUNT) corners.push(new THREE.Vector2());
	return { corners, count };
}

function discAboveHorizonFraction(altitude: number, radius: number) {
	if (altitude >= radius) return 1;
	if (altitude <= -radius) return 0;

	const height = altitude / radius;
	return (Math.acos(-height) + height * Math.sqrt(1 - height ** 2)) / Math.PI;
}

const VERTEX_SHADER = /* glsl */ `
	varying vec2 vPosition;

	void main() {
		vPosition = position.xy * ${Math.tan(GLARE_RADIUS)};
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;

const FRAGMENT_SHADER = /* glsl */ `
	varying vec2 vPosition;

	uniform vec2 uCorners[${CORNER_COUNT}];
	uniform int uCornerCount;
	uniform vec3 uHorizon;
	uniform bool uHorizonClips;
	uniform vec2 uMoonCenter;
	uniform bool uMoonClips;
	uniform float uMoonRadius;
	uniform vec3 uSolarRadiance;
	uniform float uSunAltitude;
	uniform float uSunRadius;
	uniform float uVisibleArea;

	const float PI = 3.141592653589793;
	const float GLARE_SOFTENING = ${GLARE_SOFTENING};
	const float GLARE_SCATTER = ${GLARE_SCATTER};
	const float TIP_ENERGY_FLOOR = ${TIP_ENERGY_FLOOR};
	const float INFINITY = 1.0;
	const float GEOMETRY_EPSILON = 1e-8;
	const vec3 EXTINCTION =
		vec3(5.802e-6, 13.558e-6, 33.1e-6) * 8000.0 +
		vec3(4.44e-6) * 1200.0;

	float airMass(float cosineZenith) {
		float angleDegrees = degrees(acos(clamp(cosineZenith, 0.0, 1.0)));
		return 1.0 / (
			max(cosineZenith, 0.0) +
			0.15 * pow(93.885 - angleDegrees, -1.253)
		);
	}

	bool insideSun(vec2 position) {
		return length(position) <= uSunRadius + GEOMETRY_EPSILON;
	}

	bool outsideMoon(vec2 position) {
		return
			!uMoonClips ||
			length(position - uMoonCenter) >= uMoonRadius - GEOMETRY_EPSILON;
	}

	bool aboveHorizon(vec2 position) {
		return
			!uHorizonClips ||
			dot(uHorizon.xy, position) + uHorizon.z >= -GEOMETRY_EPSILON;
	}

	bool isVisibleSource(vec2 position) {
		return insideSun(position) && outsideMoon(position) && aboveHorizon(position);
	}

	vec2 directionOrRight(vec2 vector) {
		float magnitude = length(vector);
		return magnitude > GEOMETRY_EPSILON
			? vector / magnitude
			: vec2(1.0, 0.0);
	}

	void considerCandidate(
		vec2 position,
		vec2 candidate,
		inout float nearestDistance,
		inout vec2 nearestSource
	) {
		float candidateDistance = distance(position, candidate);
		if (candidateDistance >= nearestDistance) return;
		nearestDistance = candidateDistance;
		nearestSource = candidate;
	}

	float distanceToVisibleSun(vec2 position, out vec2 nearestSource) {
		nearestSource = position;
		if (isVisibleSource(position)) return 0.0;

		float result = INFINITY;
		vec2 sunCandidate = directionOrRight(position) * uSunRadius;
		if (outsideMoon(sunCandidate) && aboveHorizon(sunCandidate)) {
			considerCandidate(position, sunCandidate, result, nearestSource);
		}

		if (uMoonClips) {
			vec2 moonCandidate =
				uMoonCenter + directionOrRight(position - uMoonCenter) * uMoonRadius;
			if (insideSun(moonCandidate) && aboveHorizon(moonCandidate)) {
				considerCandidate(position, moonCandidate, result, nearestSource);
			}
		}

		if (uHorizonClips) {
			float horizonLengthSquared = dot(uHorizon.xy, uHorizon.xy);
			vec2 horizonProjection = position - uHorizon.xy * (
				(dot(uHorizon.xy, position) + uHorizon.z) /
				horizonLengthSquared
			);
			if (insideSun(horizonProjection) && outsideMoon(horizonProjection)) {
				considerCandidate(position, horizonProjection, result, nearestSource);
			}
		}

		for (int index = 0; index < ${CORNER_COUNT}; index += 1) {
			if (index >= uCornerCount) break;
			considerCandidate(position, uCorners[index], result, nearestSource);
		}
		return result;
	}

	float localVisibleThickness(vec2 source) {
		vec2 direction = directionOrRight(source);
		float sourceRadius = length(source);
		float innerRadius = 0.0;
		float outerRadius = uSunRadius;

		if (uMoonClips) {
			float moonAlongRay = dot(uMoonCenter, direction);
			float moonPerpendicularSquared =
				dot(uMoonCenter, uMoonCenter) - moonAlongRay * moonAlongRay;
			float halfChordSquared =
				uMoonRadius * uMoonRadius - moonPerpendicularSquared;
			if (halfChordSquared > 0.0) {
				float halfChord = sqrt(halfChordSquared);
				float moonNear = moonAlongRay - halfChord;
				float moonFar = moonAlongRay + halfChord;
				if (sourceRadius >= moonFar - GEOMETRY_EPSILON) {
					innerRadius = max(innerRadius, moonFar);
				} else if (sourceRadius <= moonNear + GEOMETRY_EPSILON) {
					outerRadius = min(outerRadius, moonNear);
				} else {
					return 0.0;
				}
			}
		}

		if (uHorizonClips) {
			float horizonSlope = dot(uHorizon.xy, direction);
			if (abs(horizonSlope) <= GEOMETRY_EPSILON) {
				if (uHorizon.z < 0.0) return 0.0;
			} else {
				float horizonRadius = -uHorizon.z / horizonSlope;
				if (horizonSlope > 0.0) {
					innerRadius = max(innerRadius, horizonRadius);
				} else {
					outerRadius = min(outerRadius, horizonRadius);
				}
			}
		}

		return max(0.0, outerRadius - innerRadius);
	}

	float filteredVisibleThickness(vec2 source) {
		vec2 direction = directionOrRight(source);
		vec2 tangent = vec2(-direction.y, direction.x);
		vec2 offset = tangent * (2.0 * GLARE_SOFTENING);
		return
			0.5 * localVisibleThickness(source) +
			0.25 * localVisibleThickness(source + offset) +
			0.25 * localVisibleThickness(source - offset);
	}

	void main() {
		vec2 nearestSource;
		float distanceToSource = distanceToVisibleSun(vPosition, nearestSource);
		float softening = GLARE_SOFTENING;
		float totalSourceScale = min(
			1.0,
			uVisibleArea / (PI * softening * softening)
		);
		float localSourceScale = mix(
			TIP_ENERGY_FLOOR,
			1.0,
			smoothstep(
				0.0,
				4.0 * softening,
				filteredVisibleThickness(nearestSource)
			)
		);
		float localInfluence = 1.0 - smoothstep(
			softening,
			4.0 * softening,
			distanceToSource
		);
		localSourceScale = mix(1.0, localSourceScale, localInfluence);
		float inverseRadius = softening / (distanceToSource + softening);
		float glare = GLARE_SCATTER * totalSourceScale * localSourceScale *
			inverseRadius * inverseRadius;
		float cutoff = 1.0 - smoothstep(0.006, 0.008, length(vPosition));
		float horizonDistance = dot(uHorizon.xy, vPosition) + uHorizon.z;
		float horizonWidth = max(fwidth(horizonDistance), GEOMETRY_EPSILON);
		float horizonCoverage = smoothstep(
			-horizonWidth,
			horizonWidth,
			horizonDistance
		);
		vec3 transmittance = exp(-EXTINCTION * airMass(uSunAltitude));
		vec3 radiance =
			uSolarRadiance * transmittance * glare * cutoff * horizonCoverage;
		if (max(radiance.r, max(radiance.g, radiance.b)) <= 1e-8) discard;

		gl_FragColor = vec4(radiance, 1.0);
	}
`;

type SolarGlareProps = {
	sun: CelestialBodyState | null;
	moon: CelestialBodyState | null;
	color: THREE.ColorRepresentation;
	distance: number;
};

export function SolarGlare({ sun, moon, color, distance }: SolarGlareProps) {
	const rendering = useMemo(() => {
		if (!sun || !moon) return null;
		const visibleFraction = 1 - calculateSolarCoverage(sun, moon);
		const horizonFraction = discAboveHorizonFraction(
			sun.altitudeRad,
			sun.angularRadiusRad,
		);
		if (visibleFraction <= 0 || horizonFraction <= 0) return null;

		const {
			axisX,
			axisY,
			moonCenter,
			moonRadius,
			position,
			quaternion,
			sunRadius,
		} = createSolarFrame(sun, moon, distance);
		const horizon = new THREE.Vector3(axisX.y, axisY.y, sun.directionEnu.up);
		const moonClips = moonCenter.length() < sunRadius + moonRadius;
		const horizonClips = horizonFraction < 1;
		const { corners, count } = createCorners(
			sunRadius,
			moonCenter,
			moonRadius,
			horizon,
		);

		return {
			position,
			quaternion,
			uniforms: {
				uCorners: { value: corners },
				uCornerCount: { value: count },
				uHorizon: { value: horizon },
				uHorizonClips: { value: horizonClips },
				uMoonCenter: { value: moonCenter },
				uMoonClips: { value: moonClips },
				uMoonRadius: { value: moonRadius },
				uSolarRadiance: { value: new THREE.Color(color) },
				uSunAltitude: { value: sun.directionEnu.up },
				uSunRadius: { value: sunRadius },
				uVisibleArea: {
					value: Math.PI * sunRadius ** 2 * visibleFraction * horizonFraction,
				},
			},
		};
	}, [color, distance, moon, sun]);

	if (!rendering) return null;

	return (
		<mesh
			position={rendering.position}
			quaternion={rendering.quaternion}
			renderOrder={1000}
			scale={distance * Math.tan(GLARE_RADIUS)}
		>
			<planeGeometry args={[2, 2]} />
			<shaderMaterial
				blendDst={THREE.OneFactor}
				blendEquation={THREE.AddEquation}
				blending={THREE.CustomBlending}
				blendSrc={THREE.OneFactor}
				depthTest={false}
				depthWrite={false}
				fragmentShader={FRAGMENT_SHADER}
				side={THREE.DoubleSide}
				transparent
				uniforms={rendering.uniforms}
				vertexShader={VERTEX_SHADER}
			/>
		</mesh>
	);
}
