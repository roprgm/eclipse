import { calculateCelestialBodies } from "@/lib/celestial-bodies";
import { useStore } from "@/store";
import { useEffect } from "react";

export function CelestialBodiesSync() {
	const timestamp = useStore((state) => state.timestamp);
	const selectedPoint = useStore((state) => state.selectedPoint);
	const setBodies = useStore((state) => state.setBodies);
	const clearBodies = useStore((state) => state.clearBodies);

	useEffect(() => {
		if (!selectedPoint) {
			clearBodies();
			return;
		}

		try {
			setBodies(
				calculateCelestialBodies({
					...selectedPoint,
					timestamp: new Date(timestamp),
				}),
			);
		} catch {
			clearBodies();
		}
	}, [clearBodies, selectedPoint, setBodies, timestamp]);

	return null;
}
