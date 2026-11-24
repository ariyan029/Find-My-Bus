import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-[#4E342E]/20 bg-white/80 px-3.5 py-2 text-sm text-[#4E342E] placeholder:text-[#7E655D]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CC5500] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
