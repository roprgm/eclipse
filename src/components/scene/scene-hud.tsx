import {
	type CelestialBodyState,
	type ObserverLocation,
	calculateSolarCoverage,
} from "@/lib/celestial-bodies";
import { isoFromStops } from "@/lib/exposure";
import { languageTag, t } from "@/lib/i18n";
import { useStore } from "@/store";

const RADIANS_TO_DEGREES = 180 / Math.PI;
const LOCAL_DATE_FORMATTER = new Intl.DateTimeFormat(languageTag, {
	day: "2-digit",
	hour: "2-digit",
	hourCycle: "h23",
	minute: "2-digit",
	month: "2-digit",
	second: "2-digit",
	year: "numeric",
});
const TIME_ZONE_FORMATTERS = [languageTag, "en-US", "en-GB"].map(
	(locale) =>
		new Intl.DateTimeFormat(locale, {
			timeZoneName: "short",
		}),
);

function formatTimestamp(timestamp: number) {
	return new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");
}

function formatLocalTimestamp(timestamp: number) {
	const parts = LOCAL_DATE_FORMATTER.formatToParts(timestamp);
	const value = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value ?? "";
	const timeZoneNames = TIME_ZONE_FORMATTERS.map(
		(formatter) =>
			formatter
				.formatToParts(timestamp)
				.find((part) => part.type === "timeZoneName")?.value ?? "",
	);
	const abbreviatedTimeZone = timeZoneNames.find(
		(name) => name && !/^(GMT|UTC)/.test(name),
	);

	return {
		label: abbreviatedTimeZone ?? timeZoneNames[0] ?? "LOCAL",
		value: `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}:${value("second")}`,
	};
}

function formatBody(body: CelestialBodyState) {
	return `AZ ${(body.azimuthRad * RADIANS_TO_DEGREES).toFixed(1)}° ALT ${(body.altitudeRad * RADIANS_TO_DEGREES).toFixed(1)}°`;
}

function formatLocation(location: ObserverLocation) {
	return `${location.latitude.toFixed(3)}°, ${location.longitude.toFixed(3)}°`;
}

function formatPercentage(value: number) {
	if (value >= 99.5) return value.toFixed(0);
	if (value >= 9.95) return value.toFixed(1);
	return value.toFixed(2);
}

function formatCoverage(sun: CelestialBodyState, moon: CelestialBodyState) {
	return `${formatPercentage(calculateSolarCoverage(sun, moon) * 100)}%`;
}

type SceneHudProps = {
	cameraFocalLength: number;
	onShowUtcChange: (showUtc: boolean) => void;
	showUtc: boolean;
};

export function SceneHud({
	cameraFocalLength,
	onShowUtcChange,
	showUtc,
}: SceneHudProps) {
	const timestamp = useStore((state) => state.timestamp);
	const observerLocation = useStore((state) => state.observerLocation);
	const bodies = useStore((state) => state.bodies);
	const exposureStops = useStore((state) => state.effectiveExposureStops);
	const frameRate = useStore((state) => state.frameRate);
	const gpuTime = useStore((state) => state.gpuTime);
	const location = formatLocation(observerLocation);
	const coverage = formatCoverage(bodies.sun, bodies.moon);
	const localTimestamp = formatLocalTimestamp(timestamp);
	const displayedFrameRate = frameRate === null ? "—" : Math.round(frameRate);
	const displayedGpuTime = gpuTime === null ? "—" : `${gpuTime.toFixed(2)}ms`;
	const displayedTimestamp = showUtc
		? { label: "UTC", value: formatTimestamp(timestamp) }
		: localTimestamp;

	return (
		<>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-linear-to-b from-black/45 via-black/15 to-transparent @max-[480px]:h-24"
			/>
			<header className="pointer-events-none absolute top-6 right-7 left-7 z-20 grid grid-cols-2 gap-x-8 whitespace-nowrap font-mono text-sm text-white/90 tracking-wide @max-[480px]:top-3 @max-[480px]:right-3 @max-[480px]:left-3 @max-[480px]:gap-x-2 @max-[480px]:text-[10px] @max-[480px]:leading-[14px] @max-[480px]:tracking-normal @max-[360px]:text-[9px] @max-[360px]:leading-3">
				<div className="grid content-start gap-1 @max-[480px]:gap-0">
					<p>
						<span className="text-white/55">{t("location")} </span>
						{location}
					</p>
					<button
						aria-label={t(showUtc ? "showLocalTime" : "showUtcTime")}
						className="pointer-events-auto w-fit cursor-pointer text-left hover:text-white focus-visible:text-white"
						onClick={() => onShowUtcChange(!showUtc)}
						type="button"
					>
						<time dateTime={new Date(timestamp).toISOString()}>
							{displayedTimestamp.value}
						</time>
						<span className="text-white/55"> {displayedTimestamp.label}</span>
					</button>
					<p>
						<span className="text-white/55">ISO </span>
						{isoFromStops(exposureStops)}
						<span className="ml-4">{cameraFocalLength.toFixed(0)}mm</span>
						<span className="ml-4 text-white/55">FPS </span>
						{displayedFrameRate}
						<span className="ml-4 text-white/55">GPU </span>
						{displayedGpuTime}
					</p>
				</div>
				<div className="grid content-start justify-items-end gap-1 text-right @max-[480px]:gap-0">
					<p>
						<span className="text-white/55">{t("sun")} </span>
						{formatBody(bodies.sun)}
					</p>
					<p>
						<span className="text-white/55">{t("moon")} </span>
						{formatBody(bodies.moon)}
					</p>
					<p>
						<span className="text-white/55">{t("coverage")} </span>
						{coverage}
					</p>
				</div>
			</header>
		</>
	);
}
