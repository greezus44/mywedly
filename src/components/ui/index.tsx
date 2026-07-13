import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-sand bg-card shadow-sm", className)}>{children}</div>;
}

export function Badge({ children, variant = "default", className }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info"; className?: string }) {
  const variants = {
    default: "bg-sand/50 text-sepia",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}>{children}</span>;
}

export function Modal({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; className?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-onyx/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative z-10 w-full max-w-lg rounded-xl bg-card border border-sand shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto", className)}>
        {title && (
          <div className="flex items-center justify-between border-b border-sand px-6 py-4 sticky top-0 bg-card rounded-t-xl z-10">
            <h2 className="font-serif text-lg text-onyx">{title}</h2>
            <button onClick={onClose} className="text-sepia/60 hover:text-onyx text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-mist transition-colors">&times;</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h3 className="font-serif text-lg text-onyx mb-1">{title}</h3>
      {description && <p className="text-sm text-sepia/70 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-serif text-onyx">{title}</h1>
        {subtitle && <p className="text-sm text-sepia/70 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Toast({ message, type = "success", onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className={cn("flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg", type === "success" ? "bg-onyx text-parchment" : "bg-red-600 text-white")}>
        <span className="text-sm">{message}</span>
        <button onClick={onClose} className="opacity-60 hover:opacity-100">&times;</button>
      </div>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-sand mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
            active === tab.key ? "border-sepia text-onyx" : "border-transparent text-sepia hover:text-onyx"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
