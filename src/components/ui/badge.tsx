import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-0",
  {
    variants: {
      variant: {
        outline:
          "border-[color:var(--sage-soft)] bg-white/70 text-[#3F3A33] hover:bg-[color:var(--sage-soft)]/25",
        solid:
          "border-transparent bg-[color:var(--sage)] text-white hover:bg-[color:var(--sage-soft)] hover:text-[#3F3A33]",
        muted:
          "border-transparent bg-[color:var(--sage-soft)]/40 text-[#3F3A33] hover:bg-[color:var(--sage-soft)]/60",
        ghost:
          "border-transparent text-[#3F3A33] hover:bg-[color:var(--sage-soft)]/20",
      },
      active: {
        true: "bg-[color:var(--sage)] text-white border-transparent",
        false: "",
      },
    },
    defaultVariants: {
      variant: "outline",
      active: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({
  className,
  variant,
  active,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, active, className }))}
      {...props}
    />
  );
}

