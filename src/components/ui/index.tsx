import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]/20 shadow-[var(--shadow-soft)]", className)}>{children}</div>;
}

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "success" | "warning" | "error" }) {
  const variants = { default: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]", success: "bg-[var(--color-success)]/15 text-[var(--color-success)]", warning: "bg-[var(--color-warning)]/15 text-[var(--color-warning)]", error: "bg-[var(--color-error)]/15 text-[var(--color-error)]" };
  return <span className={cn("inline-flex items-center px-3 py-1 rounded-full font-ui text-xs font-medium", variants[variant])}>{children}</span>;
}

export function Modal({ open, onClose, children, title, maxWidth = "max-w-lg" }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; maxWidth?: string }) {
  useEffect(() => { if (open) document.body.style.overflow = "hidden"; else document.body.style.overflow = ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-[var(--color-surface)] rounded-xl shadow-2xl w-full max-h-[90vh] overflow-y-auto", maxWidth)}>
        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-border)]/15 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="font-heading text-lg text-[var(--color-text)]">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><X size={18} className="text-[var(--color-text-muted)]" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-[var(--color-text-muted)]">{icon}</div>}
      <h3 className="font-heading text-xl text-[var(--color-text)] mb-2">{title}</h3>
      {description && <p className="font-ui text-sm text-[var(--color-text-muted)] max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
}

export function SectionTitle({ children, subtitle, className }: { children: ReactNode; subtitle?: string; className?: string }) {
  return <div className={cn("text-center mb-8", className)}><h2 className="font-heading text-2xl md:text-3xl text-[var(--color-text)] mb-2">{children}</h2>{subtitle && <p className="font-ui text-sm text-[var(--color-text-muted)]">{subtitle}</p>}</div>;
}

export function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  return <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up"><div className={cn("px-5 py-3 rounded-lg shadow-lg font-ui text-sm", type === "success" ? "bg-[var(--color-success)] text-white" : "bg-[var(--color-error)] text-white")}>{message}</div></div>;
}
