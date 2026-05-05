import { Component, ErrorInfo, ReactNode } from "react";


interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Production-Grade Error Boundary
 * Catch-all for UI crashes to ensure the application remains stable and provides actionable feedback.
 */
class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground max-w-md">
              The application encountered an unexpected error. This has been logged for analysis.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Reload Application
            </button>
            {this.state.error && (
               <pre className="mt-4 p-4 rounded-lg bg-muted text-xs text-left overflow-auto max-w-full">
                 {this.state.error.message}
               </pre>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
