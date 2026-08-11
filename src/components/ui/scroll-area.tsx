import { cn } from "@/lib/styles";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import type { ComponentProps, Ref } from "react";

type ScrollAreaProps = ComponentProps<"div"> & {
	fadeStart?: boolean;
	viewportClassName?: string;
	viewportRef?: Ref<HTMLDivElement>;
};

export function ScrollArea({
	children,
	className,
	fadeStart = true,
	viewportClassName,
	viewportRef,
	...props
}: ScrollAreaProps) {
	return (
		<ScrollAreaPrimitive.Root
			className={cn("scroll-area", className)}
			data-fade-start={fadeStart}
			overflowEdgeThreshold={1}
			{...props}
		>
			<ScrollAreaPrimitive.Viewport
				className={cn("scroll-area-viewport", viewportClassName)}
				ref={viewportRef}
			>
				<ScrollAreaPrimitive.Content className="w-full min-w-0">
					{children}
				</ScrollAreaPrimitive.Content>
			</ScrollAreaPrimitive.Viewport>
			<ScrollAreaPrimitive.Scrollbar className="scroll-area-scrollbar">
				<ScrollAreaPrimitive.Thumb className="scroll-area-thumb" />
			</ScrollAreaPrimitive.Scrollbar>
		</ScrollAreaPrimitive.Root>
	);
}
