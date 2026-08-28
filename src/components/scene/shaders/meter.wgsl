import { luminance } from "@vgpu/wgsl-std/color";

@group(0) @binding(0) var radiance: texture_2d<f32>;
@group(0) @binding(1) var radianceSampler: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) f32 {
	return luminance(textureSampleLevel(radiance, radianceSampler, uv, 0.0).rgb);
}
