import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "@/lib/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** React 19 ref-as-prop support for consumers that need focus management. */
  ref?: Ref<HTMLButtonElement>;
  variant?: "glass" | "solid" | "ghost";
  size?: "sm" | "md" | "icon";
}

export function Button({ variant = "glass", size = "md", className, type = "button", ref, ...props }: Props) {
  return <button ref={ref} type={type} className={cn("btn", `btn--${variant}`, `btn--${size}`, className)} {...props} />;
}
