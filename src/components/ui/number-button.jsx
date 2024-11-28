import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Make sure you have this utility

export default function NumberButton({ text, count, variant = "outline", ...props }) {
  return (
    <Button variant={variant} {...props}>
      {text}
      <span className={cn(
        "-me-1 ms-3 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium",
        variant === "default" ? "border-white/70 text-white" : "border-border text-muted-foreground"
      )}>
        {count}
      </span>
    </Button>
  );
}
