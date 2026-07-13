import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dash-border bg-dash-surface px-6 py-12 text-center">
          <div className="mb-3 text-3xl">⚠️</div>
          <h2 className="text-lg font-semibold text-dash-text">Something went wrong</h2>
          <p className="mt-1 text-sm text-dash-muted max-w-md">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={this.handleReload}
            className="mt-4 rounded-lg bg-dash-primary px-4 py-2 text-sm font-semibold text-dash-primary-fg hover:bg-dash-primary-hover"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
