import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex min-h-8 items-center gap-2 rounded-sm border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-[#101010] text-white",
        secondary: "border-white/10 bg-[#151515] text-white/60",
        accent: "border-[#00ff85]/40 bg-[#00ff85]/5 text-[#00ff85]",
        warning: "border-[#ffeb3b]/40 bg-[#ffeb3b]/5 text-[#ffeb3b]",
        destructive: "border-[#ff3d57]/40 bg-[#ff3d57]/5 text-[#ff3d57]",
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
