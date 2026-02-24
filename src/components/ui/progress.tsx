
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    style?: {
      "--background"?: string;
      "--indicator"?: string;
      [key: string]: any;
    };
  }
>(({ className, value, style, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    style={{
      backgroundColor: style?.["--background"] || undefined,
      ...style
    }}
    {...props}
  >
    <ProgressPrimitive.Indicator
      style={{
        transform: `translateX(-${100 - (value || 0)}%)`,
        background: style?.["--indicator"] || undefined
      }}
      className="h-full w-full flex-1 transition-all bg-[#8DCEE9] bg-gray-300"
    />
  </ProgressPrimitive.Root>
));

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
