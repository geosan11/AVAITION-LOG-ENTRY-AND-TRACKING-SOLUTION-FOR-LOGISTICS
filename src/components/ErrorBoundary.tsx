import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  private handleDismiss = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6">
          <Card className="max-w-lg w-full border-error/40 bg-surface-card shadow-lg">
            <div className="flex flex-col items-center text-center p-4 gap-4">
              <div className="w-12 h-12 rounded-xl bg-error-bg border border-error-border text-error-fg flex items-center justify-center">
                <Icon name="warning" size={24} />
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">Terminal Subsystem Interrupted</h3>
                <p className="text-xs text-muted mt-1 max-w-sm">
                  An unexpected client-side exception was intercepted. Local offline data remains safely buffered in IndexedDB.
                </p>
              </div>

              {this.state.error && (
                <div className="w-full text-left bg-surface-sunken p-3 rounded-lg border border-border-subtle font-mono text-[11px] text-error-fg overflow-x-auto max-h-32">
                  {this.state.error.name}: {this.state.error.message}
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-center w-full pt-2">
                <Button variant="primary" size="sm" iconLeft="refresh" onClick={this.handleReload}>
                  Reload Terminal
                </Button>
                <Button variant="secondary" size="sm" iconLeft="terminal" onClick={this.handleDismiss}>
                  Try Again
                </Button>
                <Button variant="ghost" size="sm" iconLeft="database" onClick={this.handleResetCache}>
                  Clear Cache & Restart
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
