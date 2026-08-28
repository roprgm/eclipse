export fn coronaRadiance(
	coordinates: vec2f,
	radius: f32,
	edge: f32,
	moonVisibility: f32,
	solarRadiance: vec3f,
) -> vec3f {
	let inner = smoothstep(1.0 - edge, 1.0 + edge, radius);
	let outer = 1.0 - smoothstep(3.0, 5.5, radius);
	let profileRadius = max(radius, 1.0);
	let angle = atan2(coordinates.y, coordinates.x);
	let streamers =
		1.0 +
		0.22 * cos(2.0 * angle + 0.4) +
		0.10 * cos(5.0 * angle - 1.1) +
		0.05 * cos(11.0 * angle + 0.7);
	let ripples = 1.0 + 0.04 * cos(7.0 * (profileRadius - 1.0));
	let brightness = 1e-6 * streamers * ripples * (
		2.565 / pow(profileRadius, 17.0) +
		1.425 / pow(profileRadius, 7.0) +
		0.0532 / pow(profileRadius, 2.5)
	) * inner * outer * moonVisibility;
	return solarRadiance * brightness;
}
