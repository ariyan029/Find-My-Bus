import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CC5500] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#CC5500] text-[#F8F4E7] shadow-[0_4px_14px_0_rgba(204,85,0,0.28)] hover:bg-[#B34A00] hover:shadow-[0_6px_20px_rgba(204,85,0,0.35)]",
        destructive:
          "bg-[#B71C1C] text-white shadow-sm hover:bg-[#991B1B]",
        outline:
          "border border-[#4E342E]/22 bg-white/70 text-[#4E342E] shadow-sm backdrop-blur-md hover:bg-white hover:border-[#4E342E]/40 hover:text-[#4E342E]",
        secondary:
          "bg-[#4E342E]/10 text-[#4E342E] shadow-sm hover:bg-[#4E342E]/18",
        ghost:
          "text-[#4E342E] hover:bg-[#4E342E]/10",
        link:
          "text-[#CC5500] underline-offset-4 hover:underline",
        transit:
          "bg-[#CC5500]/12 border border-[#CC5500]/30 text-[#CC5500] hover:bg-[#CC5500]/20 hover:border-[#CC5500]/45 shadow-sm",
        chocolate:
          "bg-[#4E342E] text-[#F8F4E7] shadow-[0_4px_14px_0_rgba(78,52,46,0.25)] hover:bg-[#3D2823]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-xl px-6 text-base",
        icon: "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
