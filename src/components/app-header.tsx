import { t } from "@/lib/i18n";

export function AppHeader() {
	return (
		<header className="flex items-center justify-between gap-3 border-b px-[22px] py-[18px] max-md:px-3 max-md:py-1">
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
		</header>
	);
}
