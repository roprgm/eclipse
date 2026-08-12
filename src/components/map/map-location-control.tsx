import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { SelectedPoint } from "@/store";
import { Gps01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

type LocationStatus = "idle" | "loading" | "error";

type MapLocationControlProps = {
	onLocationFound: (point: SelectedPoint) => void;
};

export function MapLocationControl({
	onLocationFound,
}: MapLocationControlProps) {
	const [status, setStatus] = useState<LocationStatus>("idle");

	const findLocation = () => {
		if (!navigator.geolocation) {
			setStatus("error");
			return;
		}

		setStatus("loading");
		navigator.geolocation.getCurrentPosition(
			({ coords }) => {
				setStatus("idle");
				onLocationFound({
					latitude: coords.latitude,
					longitude: coords.longitude,
				});
			},
			() => setStatus("error"),
			{
				enableHighAccuracy: false,
				maximumAge: 300_000,
				timeout: 10_000,
			},
		);
	};

	return (
		<div className="absolute top-3 right-3 z-[1000]">
			<Button
				aria-label={t(status === "loading" ? "locating" : "useMyLocation")}
				className="size-9 rounded-sm bg-surface/95 shadow-md max-md:size-8"
				disabled={status === "loading"}
				onClick={findLocation}
				size="icon"
				title={t("useMyLocation")}
				variant="secondary"
			>
				<HugeiconsIcon
					aria-hidden="true"
					className={status === "loading" ? "motion-safe:animate-pulse" : ""}
					icon={Gps01Icon}
					size={18}
					strokeWidth={1.8}
				/>
			</Button>
			{status === "error" ? (
				<p
					className="absolute top-0 right-11 w-max max-w-52 rounded-sm border bg-surface/95 px-2 py-1.5 text-xs text-foreground shadow-md"
					role="alert"
				>
					{t("locationUnavailable")}
				</p>
			) : null}
		</div>
	);
}
