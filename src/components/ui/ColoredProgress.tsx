import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ColoredProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  color?: string;
  className?: string;
}

const ColoredProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ColoredProgressProps
>(({ className, value = 0, color, ...props }, ref) => {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 76) return "#22c55e";
    if (percentage >= 51) return "#eab308";
    if (percentage >= 26) return "#f97316";
    return "#ef4444";
  };

  const progressColor = color || getProgressColor(value);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 transition-all duration-500 ease-in-out"
        style={{
          transform: `translateX(-${100 - value}%)`,
          backgroundColor: progressColor,
        }}
      />
    </ProgressPrimitive.Root>
  );
});
ColoredProgress.displayName = "ColoredProgress";

export { ColoredProgress };
