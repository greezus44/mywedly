import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-dash-bg px-4 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-dash-danger">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-dash-text">
            Something went wrong
          </h1>
          <p className="mb-6 max-w-md text-sm text-dash-muted">
            An unexpected error occurred. Please try reloading the page. If the
            problem persists, contact support.
          </p>
          {this.state.error && (
            <pre className="mb-6 max-w-md overflow-x-auto rounded-md border border-dash-border bg-dash-surface p-4 text-left text-xs text-dash-muted">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="rounded-md bg-dash-primary px-6 py-3 text-sm font-medium text-dash-primary-fg transition-colors hover:bg-dash-primary-hover"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
