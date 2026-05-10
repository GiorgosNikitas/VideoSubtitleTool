import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-8 items-center gap-2 rounded-sm border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-card text-white",
        secondary: "border-white/10 bg-muted text-white/60",
        accent: "border-accent/40 bg-accent/5 text-accent",
        warning: "border-yellow-300/40 bg-yellow-300/5 text-yellow-300",
        destructive: "border-destructive/40 bg-destructive/5 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
