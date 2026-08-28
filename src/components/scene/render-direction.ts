import type { LocalDirection } from "@/lib/celestial-bodies";

export function toRenderDirection(direction: LocalDirection) {
	const length = Math.hypot(direction.east, direction.north, direction.up);
	if (length === 0) return [0, 0, 0];
	return [
		direction.east / length,
		direction.up / length,
		-direction.north / length,
	];
}
