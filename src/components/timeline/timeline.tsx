import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
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
const PLAYBACK_SPEEDS = [1, 2, 5, 10] as const;

export function Timeline() {
	const [isPlaying, setIsPlaying] = useState(false);
	const [speedIndex, setSpeedIndex] = useState(0);
	const timestamp = useStore((state) => state.timestamp);
	const setTimestamp = useStore((state) => state.setTimestamp);
	const playbackSpeed = PLAYBACK_SPEEDS[speedIndex];
	const atEnd = timestamp >= TIMELINE_END;
	const isActivelyPlaying = isPlaying && !atEnd;
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
				currentTimestamp + (time - previousTime) * playbackSpeed * 60,
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
			className="grid grid-cols-[auto_auto_minmax(100px,1fr)] items-center gap-4 border-t bg-surface px-6 max-md:gap-2 max-md:px-3"
		>
			<div className="flex items-center">
				<Button
					aria-label={t("rewindTime")}
					onClick={() => changeTime(timestamp - 10 * SECOND)}
					size="icon"
					variant="ghost"
				>
					<HugeiconsIcon
						aria-hidden="true"
						icon={Backward02Icon}
						size={16}
						strokeWidth={1.8}
					/>
				</Button>
				<Button
					aria-label={playbackLabel}
					onClick={togglePlayback}
					size="icon"
					variant="ghost"
				>
					<HugeiconsIcon
						aria-hidden="true"
						icon={playbackIcon}
						size={16}
						strokeWidth={1.8}
					/>
				</Button>
				<Button
					aria-label={t("advanceTime")}
					onClick={() => changeTime(timestamp + 10 * SECOND)}
					size="icon"
					variant="ghost"
				>
					<HugeiconsIcon
						aria-hidden="true"
						icon={Forward02Icon}
						size={16}
						strokeWidth={1.8}
					/>
				</Button>
			</div>
			<Button
				aria-label={t("changePlaybackSpeed")}
				className="tabular-nums"
				onClick={() =>
					setSpeedIndex((current) => (current + 1) % PLAYBACK_SPEEDS.length)
				}
				size="icon"
				variant="ghost"
			>
				{playbackSpeed}×
			</Button>
			<input
				aria-label={t("simulationTime")}
				className="w-full accent-primary"
				max={TIMELINE_END}
				min={TIMELINE_START}
				onChange={(event) => changeTime(event.target.valueAsNumber)}
				step={SECOND}
				type="range"
				value={timestamp}
			/>
		</section>
	);
}
