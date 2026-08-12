import { HudSlider } from "@/components/ui/hud-slider";
import { languageTag, t } from "@/lib/i18n";
import { useStore } from "@/store";
import {
	Backward02Icon,
	Forward02Icon,
	PauseIcon,
	PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

const SECOND = 1_000;
const TIMELINE_START = Date.UTC(2026, 7, 12, 17, 0);
const TIMELINE_END = Date.UTC(2026, 7, 12, 19, 45);
const TIMELINE_MARKS = [
	TIMELINE_START,
	Date.UTC(2026, 7, 12, 18, 0),
	Date.UTC(2026, 7, 12, 19, 0),
	TIMELINE_END,
] as const;
const PLAYBACK_SPEEDS = [1, 2, 5, 10] as const;
const LOCAL_TIME_FORMATTER = new Intl.DateTimeFormat(languageTag, {
	hour: "2-digit",
	hourCycle: "h23",
	minute: "2-digit",
});
const UTC_TIME_FORMATTER = new Intl.DateTimeFormat(languageTag, {
	hour: "2-digit",
	hourCycle: "h23",
	minute: "2-digit",
	timeZone: "UTC",
});

function formatTimelineMark(timestamp: number, showUtc: boolean) {
	const formatter = showUtc ? UTC_TIME_FORMATTER : LOCAL_TIME_FORMATTER;
	const parts = formatter.formatToParts(timestamp);
	const hour = parts.find((part) => part.type === "hour")?.value ?? "";
	const minute = parts.find((part) => part.type === "minute")?.value ?? "";
	return minute === "00" ? hour : `${hour}:${minute}`;
}

type TimelineProps = {
	showUtc: boolean;
};

export function Timeline({ showUtc }: TimelineProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [speedIndex, setSpeedIndex] = useState(0);
	const timestamp = useStore((state) => state.timestamp);
	const setTimestamp = useStore((state) => state.setTimestamp);
	const playbackSpeed = PLAYBACK_SPEEDS[speedIndex];
	const atEnd = timestamp >= TIMELINE_END;
	const isActivelyPlaying = isPlaying && !atEnd;
	const timelineMarks = TIMELINE_MARKS.map((value) => ({
		label: formatTimelineMark(value, showUtc),
		value,
	}));
	let playbackLabel = t("playSimulation");
	let playbackIcon = PlayIcon;
	if (isActivelyPlaying) {
		playbackLabel = t("pauseSimulation");
		playbackIcon = PauseIcon;
	}

	const changeTime = (nextTimestamp: number) => {
		setTimestamp(
			Math.min(TIMELINE_END, Math.max(TIMELINE_START, nextTimestamp)),
		);
	};

	useEffect(() => {
		if (!isPlaying || atEnd) return;

		let previousTime = performance.now();
		let frame = 0;
		const advance = (time: number) => {
			const currentTimestamp = useStore.getState().timestamp;
			const nextTimestamp = Math.min(
				TIMELINE_END,
				currentTimestamp + (time - previousTime) * playbackSpeed,
			);
			previousTime = time;
			setTimestamp(nextTimestamp);

			if (nextTimestamp < TIMELINE_END) {
				frame = requestAnimationFrame(advance);
			} else {
				setIsPlaying(false);
			}
		};
		frame = requestAnimationFrame(advance);

		return () => cancelAnimationFrame(frame);
	}, [atEnd, isPlaying, playbackSpeed, setTimestamp]);

	const togglePlayback = () => {
		if (atEnd) setTimestamp(TIMELINE_START);
		setIsPlaying(atEnd || !isPlaying);
	};

	return (
		<section
			aria-label={t("playbackTimeline")}
			className="pointer-events-none absolute right-8 bottom-2 left-8 z-20 flex justify-center font-mono text-xs text-white/55 tracking-wide @max-[480px]:right-3 @max-[480px]:bottom-1 @max-[480px]:left-3 @max-[480px]:text-[10px] @max-[480px]:tracking-normal"
		>
			<div className="pointer-events-auto grid w-full max-w-3xl grid-cols-[auto_auto_minmax(80px,1fr)] items-center gap-3 @max-[480px]:gap-2">
				<div className="flex items-center gap-1">
					<button
						aria-label={t("rewindTime")}
						className="grid size-6 cursor-pointer place-items-center outline-none transition-colors hover:text-white focus-visible:text-white disabled:pointer-events-none disabled:opacity-40"
						onClick={() => changeTime(timestamp - 10 * SECOND)}
						type="button"
					>
						<HugeiconsIcon
							aria-hidden="true"
							icon={Backward02Icon}
							size={16}
							strokeWidth={1.8}
						/>
					</button>
					<button
						aria-label={playbackLabel}
						className="grid size-6 cursor-pointer place-items-center outline-none transition-colors hover:text-white focus-visible:text-white disabled:pointer-events-none disabled:opacity-40"
						onClick={togglePlayback}
						type="button"
					>
						<HugeiconsIcon
							aria-hidden="true"
							icon={playbackIcon}
							size={16}
							strokeWidth={1.8}
						/>
					</button>
					<button
						aria-label={t("advanceTime")}
						className="grid size-6 cursor-pointer place-items-center outline-none transition-colors hover:text-white focus-visible:text-white disabled:pointer-events-none disabled:opacity-40"
						onClick={() => changeTime(timestamp + 10 * SECOND)}
						type="button"
					>
						<HugeiconsIcon
							aria-hidden="true"
							icon={Forward02Icon}
							size={16}
							strokeWidth={1.8}
						/>
					</button>
				</div>
				<button
					aria-label={t("changePlaybackSpeed")}
					className="h-6 cursor-pointer px-1 tabular-nums outline-none transition-colors hover:text-white focus-visible:text-white"
					onClick={() =>
						setSpeedIndex((current) => (current + 1) % PLAYBACK_SPEEDS.length)
					}
					type="button"
				>
					{playbackSpeed}×
				</button>
				<HudSlider
					label={t("simulationTime")}
					marks={timelineMarks}
					max={TIMELINE_END}
					min={TIMELINE_START}
					onChange={changeTime}
					showProgress
					step={SECOND}
					value={timestamp}
				/>
			</div>
		</section>
	);
}
