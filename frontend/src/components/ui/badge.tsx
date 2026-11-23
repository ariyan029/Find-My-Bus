import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-600 text-white",
        secondary:
          "border-transparent bg-[#1e1e26] text-zinc-200",
        destructive:
          "border-transparent bg-red-600/20 text-red-400 border-red-500/30",
        outline:
          "text-zinc-300 border-[#272732]",
        success:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
        warning:
          "border-amber-500/30 bg-amber-500/15 text-amber-400",
        ac:
          "border-sky-500/30 bg-sky-500/15 text-sky-400 font-bold",
        ordinary:
          "border-blue-500/30 bg-blue-500/15 text-blue-400 font-bold",
        minibus:
          "border-amber-500/30 bg-amber-500/15 text-amber-400 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
