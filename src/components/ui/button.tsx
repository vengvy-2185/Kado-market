import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
          variant === "primary" &&
            "bg-brand-gradient text-white shadow-glow hover:brightness-110 active:scale-[0.98]",
          variant === "outline" &&
            "border border-white/10 bg-white/5 text-white hover:bg-white/10",
          variant === "ghost" && "text-white/70 hover:text-white hover:bg-white/5",
          className
        )}
        {...props}
      >
        {loading ? "Please wait..." : children}
      </button>
    );
  }
);
Button.displayName = "Button";
