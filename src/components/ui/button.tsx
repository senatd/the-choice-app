import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--sage)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--sage)] text-white shadow-sm hover:bg-[color:var(--sage-soft)] hover:text-[#3F3A33]",
        outline:
          "border border-[color:var(--sage-soft)] bg-white/70 text-[#3F3A33] hover:bg-[color:var(--sage-soft)]/25",
        ghost:
          "text-[#3F3A33] hover:bg-[color:var(--sage-soft)]/20",
        subtle:
          "bg-[color:var(--sage-soft)]/35 text-[#3F3A33] hover:bg-[color:var(--sage-soft)]/55",
        terracotta:
          "bg-[color:var(--terracotta)] text-white hover:bg-[color:var(--terracotta-soft)] hover:text-[#3F3A33]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
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


