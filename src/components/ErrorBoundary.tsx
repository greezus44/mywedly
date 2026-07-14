import React, { Component, ErrorInfo, ReactNode } from "react";
import { cn } from "../lib/utils";

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback render. If not provided, the default error UI is shown. */
  fallback?: (error: Error, reload: () => void) => ReactNode;
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, className } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.handleReload);
      }

      return (
        <div
          className={cn(
            "flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dash-border bg-dash-surface p-8 text-center",
            className
          )}
        >
          <svg
            className="mb-4 h-10 w-10 text-dash-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-dash-text">
            Something went wrong
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-dash-muted">
            An unexpected error occurred. Try reloading the page to continue.
          </p>
          {error?.message && (
            <pre className="mt-3 max-w-lg overflow-x-auto rounded-md bg-dash-bg px-4 py-2 text-left text-xs text-dash-muted">
              {error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg transition-colors hover:bg-dash-primary-hover focus:outline-none focus:ring-2 focus:ring-dash-primary/30"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reload page
          </button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
