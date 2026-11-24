import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#CC5500]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#CC5500] text-[#F8F4E7] shadow-sm",
        secondary:
          "border-transparent bg-[#4E342E]/10 text-[#4E342E]",
        destructive:
          "border-transparent bg-[#B71C1C]/15 text-[#B71C1C] border-[#B71C1C]/30",
        outline:
          "text-[#4E342E] border-[#4E342E]/22 bg-white/40",
        success:
          "border-emerald-700/25 bg-emerald-600/12 text-emerald-800",
        warning:
          "border-amber-700/25 bg-amber-600/15 text-amber-800",
        ac:
          "border-[#CC5500]/30 bg-[#CC5500]/12 text-[#CC5500] font-bold",
        ordinary:
          "border-[#4E342E]/25 bg-[#4E342E]/12 text-[#4E342E] font-bold",
        minibus:
          "border-[#B25900]/30 bg-[#B25900]/12 text-[#B25900] font-bold",
        chocolate:
          "border-transparent bg-[#4E342E] text-[#F8F4E7]",
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
