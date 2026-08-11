import { cn } from "@/lib/styles";
import type { ButtonHTMLAttributes } from "react";

type SwitchProps = Omit<
	ButtonHTMLAttributes<HTMLButtonElement>,
	"onChange" | "onClick"
> & {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
};

export function Switch({
	checked,
	className,
	onCheckedChange,
	...props
}: SwitchProps) {
	return (
		<button
			aria-checked={checked}
			className={cn(
				"group inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-control p-0.5 outline-none transition-colors data-[checked=true]:bg-primary focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
				className,
			)}
			data-checked={checked}
			onClick={() => onCheckedChange(!checked)}
			role="switch"
			type="button"
			{...props}
		>
			<span className="size-4 rounded-full bg-foreground shadow-xs transition-transform group-data-[checked=true]:translate-x-4" />
		</button>
	);
}
