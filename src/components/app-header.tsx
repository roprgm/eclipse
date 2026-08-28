import { ECLIPSES, type SolarEclipse } from "@/lib/eclipses";
import { languageTag, t } from "@/lib/i18n";
import { useStore } from "@/store";

const DATE_FORMATTER = new Intl.DateTimeFormat(languageTag, {
	day: "numeric",
	month: "short",
	timeZone: "UTC",
	year: "numeric",
});

function formatEclipse(eclipse: SolarEclipse) {
	const kind = t(eclipse.kind === "total" ? "totalEclipse" : "annularEclipse");
	return `${DATE_FORMATTER.format(eclipse.date)} · ${kind}`;
}

export function AppHeader() {
	const eclipse = useStore((state) => state.eclipse);
	const selectEclipse = useStore((state) => state.selectEclipse);

	return (
		<header className="flex items-center justify-between gap-4 border-b px-[22px] py-[18px] max-md:px-3 max-md:py-1">
			<div className="flex items-center gap-2.5 max-md:gap-2">
				<img
					alt=""
					aria-hidden="true"
					className="size-6 max-md:size-5"
					src="/eclipse.svg"
				/>
				<h1 className="text-lg font-medium max-md:text-xs">Eclipse</h1>
				<label>
					<span className="sr-only">{t("selectEclipse")}</span>
					<select
						className="max-w-52 cursor-pointer bg-transparent text-muted text-xs outline-none hover:text-foreground focus-visible:text-foreground max-md:max-w-44 max-md:text-[10px]"
						onChange={(event) => {
							const selected = ECLIPSES.find(
								(candidate) => candidate.id === event.target.value,
							);
							if (selected) selectEclipse(selected);
						}}
						value={eclipse.id}
					>
						{ECLIPSES.map((candidate) => (
							<option key={candidate.id} value={candidate.id}>
								{formatEclipse(candidate)}
							</option>
						))}
					</select>
				</label>
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
		</header>
	);
}
