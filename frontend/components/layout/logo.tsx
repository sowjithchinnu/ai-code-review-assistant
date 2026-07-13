import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md";
}

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-border bg-foreground font-semibold tracking-tight text-background shadow-sm",
        size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-[11px]",
        className
      )}
    >
      AI
    </div>
  );
}
