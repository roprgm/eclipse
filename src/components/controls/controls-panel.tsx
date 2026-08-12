import { Switch } from "@/components/ui/switch";
import { MAX_CAMERA_FOCAL_LENGTH, MIN_CAMERA_FOCAL_LENGTH } from "@/lib/camera";
import { MAX_ISO_STOPS, MIN_ISO_STOPS, isoFromStops } from "@/lib/exposure";
import { t } from "@/lib/i18n";

type ControlsPanelProps = {
	autoExposure: boolean;
	cameraFocalLength: number;
	exposureStops: number;
	onAutoExposureChange: (value: boolean) => void;
	onCameraFocalLengthChange: (value: number) => void;
	onExposureChange: (value: number) => void;
};

function formatExposure(value: number) {
	return `${value > 0 ? "+" : ""}${value.toFixed(0)}`;
}

function getExposureControl(autoExposure: boolean, exposureStops: number) {
	if (autoExposure) {
		return {
			label: t("exposureCompensation"),
			max: 6,
			min: -6,
			output: formatExposure(exposureStops),
			shortLabel: "EXP",
		};
	}

	return {
		label: "ISO",
		max: MAX_ISO_STOPS,
		min: MIN_ISO_STOPS,
		output: isoFromStops(exposureStops),
		shortLabel: "ISO",
	};
}

export function ControlsPanel({
	autoExposure,
	cameraFocalLength,
	exposureStops,
	onAutoExposureChange,
	onCameraFocalLengthChange,
	onExposureChange,
}: ControlsPanelProps) {
	const control = getExposureControl(autoExposure, exposureStops);

	return (
		<section className="flex min-h-0 flex-col border-b">
			<header className="px-[22px] py-[18px] max-md:px-3 max-md:py-1">
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2.5 max-md:gap-2">
						<img
							alt=""
							aria-hidden="true"
							className="size-6 max-md:size-5"
							src="/eclipse.svg"
						/>
						<h1 className="text-lg font-medium max-md:text-xs">Eclipse</h1>
					</div>
					<a
						aria-label={t("githubSource")}
						className="hidden text-xs text-muted transition-colors hover:text-foreground focus-visible:text-foreground md:inline"
						href="https://github.com/roprgm/eclipse"
						rel="noreferrer"
						target="_blank"
					>
						GitHub ↗
					</a>
				</div>
			</header>

			<div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 px-[22px] pb-[22px] text-sm max-md:gap-x-2 max-md:gap-y-1.5 max-md:px-3 max-md:pb-1.5 max-md:text-[12px] max-md:leading-4">
				<label className="grid grid-cols-[auto_minmax(96px,1fr)_auto] items-center gap-3 max-md:grid-cols-[auto_minmax(64px,1fr)_auto] max-md:gap-2">
					<span>{control.shortLabel}</span>
					<input
						aria-label={control.label}
						className="w-full accent-primary"
						max={control.max}
						min={control.min}
						onChange={(event) => onExposureChange(event.target.valueAsNumber)}
						step={1}
						type="range"
						value={exposureStops}
					/>
					<output className="text-muted tabular-nums">{control.output}</output>
				</label>
				<div className="flex items-center gap-2 max-md:gap-1.5">
					<label htmlFor="auto-exposure">Auto</label>
					<Switch
						checked={autoExposure}
						id="auto-exposure"
						onCheckedChange={onAutoExposureChange}
					/>
				</div>
				<label className="col-span-2 grid grid-cols-[auto_minmax(96px,1fr)_auto] items-center gap-3 max-md:grid-cols-[auto_minmax(64px,1fr)_auto] max-md:gap-2">
					<span>MM</span>
					<input
						aria-label={t("focalLength")}
						className="w-full accent-primary"
						max={MAX_CAMERA_FOCAL_LENGTH}
						min={MIN_CAMERA_FOCAL_LENGTH}
						onChange={(event) =>
							onCameraFocalLengthChange(event.target.valueAsNumber)
						}
						step={1}
						type="range"
						value={cameraFocalLength}
					/>
					<output className="text-muted tabular-nums">
						{cameraFocalLength.toFixed(0)}mm
					</output>
				</label>
			</div>
		</section>
	);
}
