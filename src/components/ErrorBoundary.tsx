import { Component, type ReactNode } from "react";

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: unknown) { console.error("ErrorBoundary caught:", error, info); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)] p-8">
        <h1 className="text-3xl font-heading mb-3">Something went wrong</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-md text-center">{this.state.error?.message || "An unexpected error occurred."}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[var(--color-primary)] text-[var(--color-bg)] text-sm uppercase tracking-wider" style={{ borderRadius: "var(--radius)" }}>Reload page</button>
      </div>
    );
    return this.props.children;
  }
}
