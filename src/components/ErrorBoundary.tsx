import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dash-bg px-4 text-center">
          <h1 className="text-2xl font-bold text-dash-text">Something went wrong</h1>
          <p className="max-w-md text-sm text-dash-muted">{this.state.error?.message ?? "An unexpected error occurred."}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
