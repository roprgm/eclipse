import { ControlsPanel } from "@/components/controls/controls-panel";
import { EclipseMap } from "@/components/map/eclipse-map";
import { CelestialBodiesSync } from "@/components/scene/celestial-bodies-sync";
import { EclipseScene } from "@/components/scene/eclipse-scene";
import { SceneHud } from "@/components/scene/scene-hud";
import { Timeline } from "@/components/timeline/timeline";
import { useStore } from "@/store";
import { useState } from "react";

function getExposureStops(
	autoExposure: boolean,
	compensationStops: number,
	manualIsoStops: number,
) {
	if (autoExposure) return compensationStops;
	return manualIsoStops;
}

export function App() {
	const [autoExposure, setAutoExposure] = useState(true);
	const [compensationStops, setCompensationStops] = useState(0);
	const [manualIsoStops, setManualIsoStops] = useState(0);
	const exposureStops = getExposureStops(
		autoExposure,
		compensationStops,
		manualIsoStops,
	);
	const handleAutoExposureChange = (enabled: boolean) => {
		if (enabled) {
			setAutoExposure(true);
			return;
		}

		setManualIsoStops(useStore.getState().effectiveExposureStops);
		setAutoExposure(false);
	};
	const handleExposureChange = (stops: number) => {
		if (autoExposure) {
			setCompensationStops(stops);
			return;
		}

		setManualIsoStops(stops);
	};

	return (
		<main className="grid h-svh grid-cols-[clamp(400px,25vw,480px)_minmax(0,1fr)] max-md:grid-cols-1 max-md:grid-rows-[55svh_minmax(0,1fr)]">
			<CelestialBodiesSync />
			<aside className="grid min-h-0 grid-rows-[3fr_2fr] border-r bg-surface max-md:row-start-2 max-md:border-t max-md:border-r-0">
				<ControlsPanel
					autoExposure={autoExposure}
					exposureStops={exposureStops}
					onAutoExposureChange={handleAutoExposureChange}
					onExposureChange={handleExposureChange}
				/>

				<EclipseMap />
			</aside>

			<div className="grid min-h-0 grid-rows-[minmax(0,1fr)_56px] max-md:row-start-1">
				<section
					aria-label="Eclipse scene"
					className="@container relative min-w-0 overflow-hidden"
				>
					<EclipseScene
						autoExposure={autoExposure}
						exposureStops={exposureStops}
					/>
					<SceneHud />
				</section>

				<Timeline />
			</div>
		</main>
	);
}
