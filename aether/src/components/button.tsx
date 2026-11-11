import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "glass" | "solid" | "ghost";
  size?: "sm" | "md" | "icon";
}

export function Button({ variant = "glass", size = "md", className, type = "button", ...props }: Props) {
  return <button type={type} className={cn("btn", `btn--${variant}`, `btn--${size}`, className)} {...props} />;
}
