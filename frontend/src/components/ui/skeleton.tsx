import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[#4E342E]/8 border border-[#4E342E]/5",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
