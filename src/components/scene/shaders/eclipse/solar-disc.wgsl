import { EclipseGeometry, isVisibleSource } from "./geometry.wgsl";

export fn solarDiscCoverage(
	coordinates: vec2f,
	geometry: EclipseGeometry,
	pixelX: vec2f,
	pixelY: vec2f,
) -> vec2f {
	var coverage = vec2f(0.0);
	for (var y = 0; y < 4; y += 1) {
		for (var x = 0; x < 4; x += 1) {
			let offset = (vec2f(f32(x), f32(y)) + 0.5) / 4.0 - 0.5;
			let position = coordinates + pixelX * offset.x + pixelY * offset.y;
			coverage += vec2f(
				select(0.0, 1.0, isVisibleSource(position, geometry, 0.0)),
				select(0.0, 1.0, length(position - geometry.moonCenter) >= geometry.moonRadius),
			);
		}
	}
	return coverage / 16.0;
}
