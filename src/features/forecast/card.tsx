import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  id?: string;
}

/** Glass card with an accessible heading. Every dashboard panel uses this for consistent semantics. */
export function Card({ title, icon, children, className, action, id }: CardProps) {
  return (
    <section className={cn("card", className)} aria-labelledby={id ? `${id}-title` : undefined} {...(id ? { id } : {})}>
      <header className="card__header">
        <h2 id={id ? `${id}-title` : undefined} className="card__title">
          {icon}
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}
