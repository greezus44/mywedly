import { Component, type ReactNode, type ErrorInfo } from "react";
interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("[ErrorBoundary]", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
            <h1 className="text-xl font-semibold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-500 mb-4">{this.state.error?.message || "An unexpected error occurred."}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">Reload page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
