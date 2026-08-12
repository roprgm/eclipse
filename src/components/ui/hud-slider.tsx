import { cn } from "@/lib/styles";

type HudSliderMark = {
	label: string;
	value: number;
};

type HudSliderProps = {
	label: string;
	marks?: readonly HudSliderMark[];
	max: number;
	min: number;
	onChange: (value: number) => void;
	showProgress?: boolean;
	step: number;
	value: number;
};

export function HudSlider({
	label,
	marks,
	max,
	min,
	onChange,
	showProgress = false,
	step,
	value,
}: HudSliderProps) {
	const progress = ((value - min) / (max - min)) * 100;

	return (
		<span
			className={cn(
				"relative flex h-5 min-w-0 items-center has-[:focus-visible]:outline has-[:focus-visible]:outline-white/50 has-[:focus-visible]:outline-offset-2",
				marks && "h-7",
			)}
		>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/25"
			/>
			{showProgress ? (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute top-1/2 left-0 h-px -translate-y-1/2 bg-white/70"
					style={{ width: `${progress}%` }}
				/>
			) : null}
			{marks?.map((mark) => (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute top-1/2"
					key={mark.value}
					style={{ left: `${((mark.value - min) / (max - min)) * 100}%` }}
				>
					<span className="absolute h-1.5 w-px -translate-y-1/2 bg-white/30" />
					<span
						className="absolute top-1.5 text-[8px] leading-none tabular-nums text-white/35"
						style={{
							transform:
								mark.value === min
									? "none"
									: mark.value === max
										? "translateX(-100%)"
										: "translateX(-50%)",
						}}
					>
						{mark.label}
					</span>
				</span>
			))}
			<input
				aria-label={label}
				className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent focus-visible:outline-none [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-px [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:h-px [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-px [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-5.5px] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-px [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-white"
				max={max}
				min={min}
				onChange={(event) => onChange(event.target.valueAsNumber)}
				step={step}
				type="range"
				value={value}
			/>
		</span>
	);
}
