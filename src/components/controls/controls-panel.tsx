import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

type ControlsPanelProps = {
	autoExposure: boolean;
	exposureEv: number;
	onAutoExposureChange: (value: boolean) => void;
	onExposureChange: (value: number) => void;
};

function formatExposure(value: number) {
	return `${value > 0 ? "+" : ""}${value.toFixed(1)} EV`;
}

export function ControlsPanel({
	autoExposure,
	exposureEv,
	onAutoExposureChange,
	onExposureChange,
}: ControlsPanelProps) {
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
							Exposure
							<output className="text-muted tabular-nums">
								{formatExposure(exposureEv)}
							</output>
						</span>
						<input
							className="w-full accent-primary disabled:opacity-50"
							disabled={autoExposure}
							max={6}
							min={-6}
							onChange={(event) => onExposureChange(event.target.valueAsNumber)}
							step={0.1}
							type="range"
							value={exposureEv}
						/>
					</label>
				</div>
			</ScrollArea>
		</section>
	);
}
