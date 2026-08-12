import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { MAX_ISO_STOPS, MIN_ISO_STOPS, isoFromStops } from "@/lib/exposure";

type ControlsPanelProps = {
	autoExposure: boolean;
	exposureStops: number;
	onAutoExposureChange: (value: boolean) => void;
	onExposureChange: (value: number) => void;
};

function formatExposure(value: number) {
	return `${value > 0 ? "+" : ""}${value.toFixed(0)} stops`;
}

function getExposureControl(autoExposure: boolean, exposureStops: number) {
	if (autoExposure) {
		return {
			label: "Exposure compensation",
			max: 6,
			min: -6,
			output: formatExposure(exposureStops),
		};
	}

	return {
		label: "ISO",
		max: MAX_ISO_STOPS,
		min: MIN_ISO_STOPS,
		output: isoFromStops(exposureStops),
	};
}

export function ControlsPanel({
	autoExposure,
	exposureStops,
	onAutoExposureChange,
	onExposureChange,
}: ControlsPanelProps) {
	const control = getExposureControl(autoExposure, exposureStops);

	return (
		<section className="flex min-h-0 flex-col border-b">
			<header className="px-6 py-5">
				<h1 className="text-lg font-medium">Eclipse</h1>
			</header>

			<ScrollArea className="min-h-0 flex-1">
				<div className="grid gap-5 px-6 pb-6">
					<div className="flex items-center justify-between text-sm">
						<label htmlFor="auto-exposure">Auto exposure</label>
						<Switch
							checked={autoExposure}
							id="auto-exposure"
							onCheckedChange={onAutoExposureChange}
						/>
					</div>
					<label className="grid gap-2 text-sm">
						<span className="flex justify-between">
							{control.label}
							<output className="text-muted tabular-nums">
								{control.output}
							</output>
						</span>
						<input
							className="w-full accent-primary"
							max={control.max}
							min={control.min}
							onChange={(event) => onExposureChange(event.target.valueAsNumber)}
							step={1}
							type="range"
							value={exposureStops}
						/>
					</label>
				</div>
			</ScrollArea>
		</section>
	);
}
