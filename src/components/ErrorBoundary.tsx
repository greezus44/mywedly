import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center p-6 text-center">
          <div className="mb-3 text-dash-danger">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-dash-text">Something went wrong</h2>
          <p className="mt-1 text-sm text-dash-muted max-w-sm">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 rounded-md bg-dash-primary px-4 py-2 text-sm font-medium text-dash-primary-fg hover:bg-dash-primary-hover transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}
