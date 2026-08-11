import { cn } from "@/lib/styles";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { type VariantProps, cva } from "class-variance-authority";

const buttonVariants = cva(
	cn(
		"inline-flex cursor-pointer touch-manipulation select-none items-center justify-center rounded-md font-medium text-sm shadow-xs outline-none transition-all duration-150",
		"focus-visible:ring-2 focus-visible:ring-ring",
		"disabled:pointer-events-none disabled:opacity-40",
		"active:scale-98",
	),
	{
		variants: {
			variant: {
				primary:
					"border border-transparent bg-primary/25 bg-clip-padding text-white/90 hover:bg-primary/30 data-pressed:bg-primary/35 data-pressed:text-white",
				secondary:
					"border border-border bg-control text-foreground data-popup-open:border-border-focus data-pressed:border-border-focus data-popup-open:bg-control-hover data-pressed:bg-control-hover data-popup-open:ring-2 data-popup-open:ring-ring data-pressed:ring-2 data-pressed:ring-ring",
				ghost:
					"text-muted shadow-none hover:bg-elevated/50 hover:text-foreground data-pressed:bg-control-hover",
			},
			size: {
				default:
					"h-9 px-3 has-[>[data-slot=icon]:last-child]:pr-2.5 has-[>svg:last-child]:pr-2.5 has-[>[data-slot=icon]:first-child]:pl-2.5 has-[>svg:first-child]:pl-2.5",
				icon: "size-8 p-0",
			},
		},
		defaultVariants: { size: "default", variant: "primary" },
	},
);

type ButtonProps = Omit<ButtonPrimitive.Props, "className" | "render"> &
	VariantProps<typeof buttonVariants> & { className?: string };

export function Button({ className, size, variant, ...props }: ButtonProps) {
	const { children, ...buttonProps } = props;
	const content =
		typeof children === "string" || typeof children === "number" ? (
			<span className="min-w-0 truncate">{children}</span>
		) : (
			children
		);

	return (
		<ButtonPrimitive
			className={cn(
				buttonVariants({ size, variant }),
				"min-w-0 max-w-full shrink-0 whitespace-nowrap",
				className,
			)}
			{...buttonProps}
		>
			{content}
		</ButtonPrimitive>
	);
}
