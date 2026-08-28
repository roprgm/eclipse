import { applyExposure, linearToSrgb3 } from "@vgpu/wgsl-std/color";

@group(0) @binding(0) var radiance: texture_2d<f32>;
@group(0) @binding(1) var<uniform> exposureStops: f32;

fn rrtAndOdtFit(value: vec3f) -> vec3f {
	let numerator = value * (value + 0.0245786) - 0.000090537;
	let denominator = value * (0.983729 * value + 0.432951) + 0.238081;
	return numerator / denominator;
}

fn acesFilmicToneMapping(value: vec3f) -> vec3f {
	let inputTransform = mat3x3f(
		vec3f(0.59719, 0.076, 0.0284),
		vec3f(0.35458, 0.90834, 0.13383),
		vec3f(0.04823, 0.01566, 0.83777),
	);
	let outputTransform = mat3x3f(
		vec3f(1.60475, -0.10208, -0.00327),
		vec3f(-0.53108, 1.10813, -0.07276),
		vec3f(-0.07367, -0.00605, 1.07602),
	);
	return clamp(
		outputTransform * rrtAndOdtFit(inputTransform * value),
		vec3f(0.0),
		vec3f(1.0),
	);
}

@fragment
fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {
	let hdr = textureLoad(radiance, vec2i(position.xy), 0).rgb;
	let exposed = applyExposure(hdr, exposureStops) / 0.6;
	let display = linearToSrgb3(acesFilmicToneMapping(exposed));
	return vec4f(display, 1.0);
}
