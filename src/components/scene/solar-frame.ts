import type { CelestialBodyState } from "@/lib/celestial-bodies";
import * as THREE from "three";
import { toThreeDirection } from "./three-directions";

export function createSolarFrame(
	sun: CelestialBodyState,
	moon: CelestialBodyState,
	distance: number,
) {
	const sunDirection = toThreeDirection(sun.directionEnu, new THREE.Vector3());
	const moonDirection = toThreeDirection(
		moon.directionEnu,
		new THREE.Vector3(),
	);
	const vertical = new THREE.Vector3(0, 1, 0).addScaledVector(
		sunDirection,
		-sunDirection.y,
	);
	if (vertical.lengthSq() < 1e-12) vertical.set(1, 0, 0);
	vertical.normalize();

	const axisX = new THREE.Vector3()
		.crossVectors(vertical, sunDirection)
		.normalize();
	const axisY = new THREE.Vector3()
		.crossVectors(sunDirection, axisX)
		.normalize();
	const moonDepth = moonDirection.dot(sunDirection);
	const moonCenter =
		moonDepth > 0
			? new THREE.Vector2(
					moonDirection.dot(axisX) / moonDepth,
					moonDirection.dot(axisY) / moonDepth,
				)
			: new THREE.Vector2(10, 10);
	const rotation = new THREE.Matrix4().makeBasis(axisX, axisY, sunDirection);

	return {
		axisX,
		axisY,
		moonCenter,
		moonRadius: Math.tan(moon.angularRadiusRad),
		position: sunDirection.clone().multiplyScalar(distance),
		quaternion: new THREE.Quaternion().setFromRotationMatrix(rotation),
		sunRadius: Math.tan(sun.angularRadiusRad),
	};
}
