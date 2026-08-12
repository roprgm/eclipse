import { AppHeader } from "@/components/app-header";
import { EclipseMap } from "@/components/map/eclipse-map";
import { CelestialBodiesSync } from "@/components/scene/celestial-bodies-sync";
import { EclipseScene } from "@/components/scene/eclipse-scene";
import { SceneControls } from "@/components/scene/scene-controls";
import { SceneHud } from "@/components/scene/scene-hud";
import { Timeline } from "@/components/timeline/timeline";
import { DEFAULT_CAMERA_FOCAL_LENGTH } from "@/lib/camera";
import { t } from "@/lib/i18n";
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
	const [showUtc, setShowUtc] = useState(false);
	const [compensationStops, setCompensationStops] = useState(0);
	const [manualIsoStops, setManualIsoStops] = useState(0);
	const [cameraFocalLength, setCameraFocalLength] = useState(
		DEFAULT_CAMERA_FOCAL_LENGTH,
	);
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
		<main className="grid h-svh grid-cols-[clamp(480px,32vw,600px)_minmax(0,1fr)] max-md:grid-cols-1 max-md:grid-rows-[44svh_minmax(0,1fr)]">
			<CelestialBodiesSync />
			<aside className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] border-r bg-surface max-md:row-start-1 max-md:border-r-0 max-md:border-b">
				<AppHeader />
				<EclipseMap />
			</aside>

			<div className="min-h-0 max-md:row-start-2">
				<section
					aria-label={t("eclipseScene")}
					className="@container relative h-full min-w-0 overflow-hidden"
				>
					<EclipseScene
						autoExposure={autoExposure}
						cameraFocalLength={cameraFocalLength}
						exposureStops={exposureStops}
						onCameraFocalLengthChange={setCameraFocalLength}
					/>
					<SceneHud
						cameraFocalLength={cameraFocalLength}
						onShowUtcChange={setShowUtc}
						showUtc={showUtc}
					/>
					<SceneControls
						autoExposure={autoExposure}
						cameraFocalLength={cameraFocalLength}
						exposureStops={exposureStops}
						onAutoExposureChange={handleAutoExposureChange}
						onCameraFocalLengthChange={setCameraFocalLength}
						onExposureChange={handleExposureChange}
					/>
					<Timeline showUtc={showUtc} />
				</section>
			</div>
		</main>
	);
}
