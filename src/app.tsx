import { ControlsPanel } from "@/components/controls/controls-panel";
import { EclipseMap } from "@/components/map/eclipse-map";
import { CelestialBodiesSync } from "@/components/scene/celestial-bodies-sync";
import { EclipseScene } from "@/components/scene/eclipse-scene";
import { SceneHud } from "@/components/scene/scene-hud";
import { Timeline } from "@/components/timeline/timeline";
import { calculateSolarCoverage } from "@/lib/celestial-bodies";
import { useStore } from "@/store";
import { useState } from "react";

function calculateAutomaticExposure(coverage: number | null) {
	if (coverage === null) return 0;
	return Math.min(6, -4 - Math.log2(Math.max(1 - coverage, 1 / 1_024)));
}

export function App() {
	const [autoExposure, setAutoExposure] = useState(false);
	const [exposureEv, setExposureEv] = useState(0);
	const sun = useStore((state) => state.sun);
	const moon = useStore((state) => state.moon);
	let solarCoverage: number | null = null;
	if (sun && moon) solarCoverage = calculateSolarCoverage(sun, moon);
	let effectiveExposureEv = exposureEv;
	if (autoExposure) {
		effectiveExposureEv = calculateAutomaticExposure(solarCoverage);
	}
	return (
		<main className="grid h-svh grid-cols-[clamp(400px,25vw,480px)_minmax(0,1fr)] max-md:grid-cols-1 max-md:grid-rows-[55svh_minmax(0,1fr)]">
			<CelestialBodiesSync />
			<aside className="grid min-h-0 grid-rows-[3fr_2fr] border-r bg-surface max-md:row-start-2 max-md:border-t max-md:border-r-0">
				<ControlsPanel
					autoExposure={autoExposure}
					exposureEv={effectiveExposureEv}
					onAutoExposureChange={setAutoExposure}
					onExposureChange={setExposureEv}
				/>

				<EclipseMap />
			</aside>

			<div className="grid min-h-0 grid-rows-[minmax(0,1fr)_56px] max-md:row-start-1">
				<section
					aria-label="Eclipse scene"
					className="@container relative min-w-0 overflow-hidden"
				>
					<EclipseScene exposureEv={effectiveExposureEv} />
					<SceneHud />
				</section>

				<Timeline />
			</div>
		</main>
	);
}
