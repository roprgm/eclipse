const GEOMETRY_EPSILON = 1e-8;
const NO_SOURCE_DISTANCE = 1.0;

export struct EclipseGeometry {
	moonCenter: vec2f,
	horizon: vec3f,
	sunRadius: f32,
	moonRadius: f32,
}

export fn isVisibleSource(
	position: vec2f,
	geometry: EclipseGeometry,
	tolerance: f32,
) -> bool {
	return length(position) <= geometry.sunRadius + tolerance &&
		length(position - geometry.moonCenter) >=
			geometry.moonRadius - tolerance &&
		dot(geometry.horizon.xy, position) + geometry.horizon.z >= -tolerance;
}

fn directionOrRight(vector: vec2f) -> vec2f {
	let magnitude = length(vector);
	if (magnitude > GEOMETRY_EPSILON) {
		return vector / magnitude;
	}
	return vec2f(1.0, 0.0);
}

fn candidateDistance(
	position: vec2f,
	candidate: vec2f,
	geometry: EclipseGeometry,
) -> f32 {
	if (!isVisibleSource(candidate, geometry, GEOMETRY_EPSILON)) {
		return NO_SOURCE_DISTANCE;
	}
	return distance(position, candidate);
}

fn moonSunIntersectionDistance(
	position: vec2f,
	geometry: EclipseGeometry,
) -> f32 {
	let centerDistance = length(geometry.moonCenter);
	if (
		centerDistance <= GEOMETRY_EPSILON ||
		centerDistance > geometry.sunRadius + geometry.moonRadius ||
		centerDistance < abs(geometry.sunRadius - geometry.moonRadius)
	) {
		return NO_SOURCE_DISTANCE;
	}

	let along = (
		geometry.sunRadius * geometry.sunRadius -
		geometry.moonRadius * geometry.moonRadius +
		centerDistance * centerDistance
	) / (2.0 * centerDistance);
	let across = sqrt(max(
		0.0,
		geometry.sunRadius * geometry.sunRadius - along * along,
	));
	let direction = geometry.moonCenter / centerDistance;
	let center = direction * along;
	let perpendicular = vec2f(-direction.y, direction.x) * across;
	return min(
		candidateDistance(position, center + perpendicular, geometry),
		candidateDistance(position, center - perpendicular, geometry),
	);
}

fn horizonCircleIntersectionDistance(
	position: vec2f,
	center: vec2f,
	radius: f32,
	unitNormal: vec2f,
	tangent: vec2f,
	horizonLength: f32,
	geometry: EclipseGeometry,
) -> f32 {
	let signedDistance = (
		dot(geometry.horizon.xy, center) + geometry.horizon.z
	) / horizonLength;
	if (abs(signedDistance) > radius) {
		return NO_SOURCE_DISTANCE;
	}

	let middle = center - unitNormal * signedDistance;
	let halfLength = sqrt(max(0.0, radius * radius - signedDistance * signedDistance));
	let offset = tangent * halfLength;
	return min(
		candidateDistance(position, middle + offset, geometry),
		candidateDistance(position, middle - offset, geometry),
	);
}

export fn distanceToVisibleSun(
	position: vec2f,
	geometry: EclipseGeometry,
) -> f32 {
	if (isVisibleSource(position, geometry, GEOMETRY_EPSILON)) {
		return 0.0;
	}

	var result = candidateDistance(
		position,
		directionOrRight(position) * geometry.sunRadius,
		geometry,
	);
	result = min(result, candidateDistance(
		position,
		geometry.moonCenter +
			directionOrRight(position - geometry.moonCenter) * geometry.moonRadius,
		geometry,
	));

	let horizonLengthSquared = dot(geometry.horizon.xy, geometry.horizon.xy);
	let horizonProjection = position - geometry.horizon.xy * (
		(dot(geometry.horizon.xy, position) + geometry.horizon.z) /
		max(horizonLengthSquared, GEOMETRY_EPSILON)
	);
	result = min(result, candidateDistance(
		position,
		horizonProjection,
		geometry,
	));
	result = min(result, moonSunIntersectionDistance(position, geometry));

	let horizonLength = length(geometry.horizon.xy);
	if (horizonLength > GEOMETRY_EPSILON) {
		let unitNormal = geometry.horizon.xy / horizonLength;
		let tangent = vec2f(-unitNormal.y, unitNormal.x);
		result = min(result, horizonCircleIntersectionDistance(
			position,
			vec2f(0.0),
			geometry.sunRadius,
			unitNormal,
			tangent,
			horizonLength,
			geometry,
		));
		result = min(result, horizonCircleIntersectionDistance(
			position,
			geometry.moonCenter,
			geometry.moonRadius,
			unitNormal,
			tangent,
			horizonLength,
			geometry,
		));
	}

	return result;
}
