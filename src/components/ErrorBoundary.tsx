import React from "react";

interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error("ErrorBoundary caught:", error, info); }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-600 mb-4">An unexpected error occurred. Try reloading the page.</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => this.setState({ hasError: false, error: null })} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm">Try Again</button>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 text-sm">Reload Page</button>
            </div>
            {this.state.error && (<details className="mt-4 text-left"><summary className="text-xs text-slate-500 cursor-pointer">Error details</summary><pre className="mt-2 text-xs text-red-600 overflow-auto">{this.state.error.message}</pre></details>)}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
