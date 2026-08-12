import { HudSlider } from "@/components/ui/hud-slider";
import { MAX_CAMERA_FOCAL_LENGTH, MIN_CAMERA_FOCAL_LENGTH } from "@/lib/camera";
import { MAX_ISO_STOPS, MIN_ISO_STOPS, isoFromStops } from "@/lib/exposure";
import { t } from "@/lib/i18n";

type HudRangeProps = {
	label: string;
	max: number;
	min: number;
	onChange: (value: number) => void;
	output: string | number;
	shortLabel: string;
	value: number;
};

function HudRange({
	label,
	max,
	min,
	onChange,
	output,
	shortLabel,
	value,
}: HudRangeProps) {
	return (
		<label className="grid min-w-0 grid-cols-[auto_minmax(80px,1fr)_auto] items-center gap-3 text-white/90 has-[:focus-visible]:text-white @max-[480px]:grid-cols-[auto_minmax(32px,1fr)_auto] @max-[480px]:gap-1">
			<span className="text-white/55">{shortLabel}</span>
			<HudSlider
				label={label}
				max={max}
				min={min}
				onChange={onChange}
				step={1}
				value={value}
			/>
			<output className="min-w-7 text-right tabular-nums text-white/70">
				{output}
			</output>
		</label>
	);
}

type HudSwitchProps = {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
};

function HudSwitch({ checked, onCheckedChange }: HudSwitchProps) {
	return (
		<button
			aria-checked={checked}
			aria-label={t("autoExposure")}
			className="group flex h-5 cursor-pointer items-center gap-2 text-white/55 outline-none hover:text-white focus-visible:text-white disabled:pointer-events-none disabled:opacity-40"
			data-checked={checked}
			onClick={() => onCheckedChange(!checked)}
			role="switch"
			type="button"
		>
			<span className="group-data-[checked=true]:text-white/80">AUTO</span>
			<span className="grid h-4 min-w-8 place-items-center border border-white/25 px-1 text-[8px] leading-none transition-colors group-data-[checked=true]:border-white/55 group-data-[checked=true]:text-white/90">
				{checked ? "ON" : "OFF"}
			</span>
		</button>
	);
}

type SceneControlsProps = {
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

export function SceneControls({
	autoExposure,
	cameraFocalLength,
	exposureStops,
	onAutoExposureChange,
	onCameraFocalLengthChange,
	onExposureChange,
}: SceneControlsProps) {
	const exposureControl = autoExposure
		? {
				label: t("exposureCompensation"),
				max: 6,
				min: -6,
				output: formatExposure(exposureStops),
				shortLabel: "EXP",
			}
		: {
				label: "ISO",
				max: MAX_ISO_STOPS,
				min: MIN_ISO_STOPS,
				output: isoFromStops(exposureStops),
				shortLabel: "ISO",
			};

	return (
		<>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-black/25 backdrop-blur-[3px] @max-[480px]:h-24"
			/>
			<div className="pointer-events-none absolute right-8 bottom-10 left-8 z-20 flex justify-center font-mono text-xs tracking-wide @max-[480px]:right-3 @max-[480px]:bottom-10 @max-[480px]:left-3 @max-[480px]:text-[10px] @max-[480px]:tracking-normal">
				<div className="pointer-events-auto grid w-full max-w-2xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 py-2 @max-[640px]:gap-2 @max-[640px]:py-0.5">
					<HudRange
						label={exposureControl.label}
						max={exposureControl.max}
						min={exposureControl.min}
						onChange={onExposureChange}
						output={exposureControl.output}
						shortLabel={exposureControl.shortLabel}
						value={exposureStops}
					/>
					<HudSwitch
						checked={autoExposure}
						onCheckedChange={onAutoExposureChange}
					/>
					<div className="min-w-0">
						<HudRange
							label={t("focalLength")}
							max={MAX_CAMERA_FOCAL_LENGTH}
							min={MIN_CAMERA_FOCAL_LENGTH}
							onChange={onCameraFocalLengthChange}
							output={`${cameraFocalLength.toFixed(0)}mm`}
							shortLabel="ZOOM"
							value={cameraFocalLength}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
