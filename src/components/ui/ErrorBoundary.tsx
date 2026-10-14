import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] h-full p-6 text-center bg-white rounded-2xl border border-slate-100 shadow-sm m-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Terjadi Kendala pada Halaman Ini</h2>
          <p className="text-sm text-slate-500 max-w-md mb-4">
            Sistem mendeteksi kendala rendering komponen. Silakan segarkan halaman atau kembali ke dashboard.
          </p>
          {this.state.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-left text-xs text-rose-700 max-w-xl mb-6 font-mono break-all overflow-auto max-h-40">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              onClick={this.handleReload}
              className="bg-[#1e2f65] hover:bg-[#2A4080] text-white flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Segarkan Halaman
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/dashboard";
              }}
            >
              Ke Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
