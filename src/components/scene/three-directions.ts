import type { LocalDirection } from "@/lib/celestial-bodies";
import type * as THREE from "three";

export function toThreeDirection(
	direction: LocalDirection,
	target: THREE.Vector3,
) {
	return target.set(direction.east, direction.up, -direction.north).normalize();
}
