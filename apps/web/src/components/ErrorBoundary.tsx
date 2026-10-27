import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Logo } from './Logo';

interface ErrorBoundaryProperties {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProperties, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 selection:bg-emerald-500 selection:text-slate-950 font-sans">
          <div className="w-full max-w-lg rounded-3xl border border-rose-500/30 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
            <div className="flex justify-center">
              <Logo size={48} showWordmark={true} />
            </div>

            <div className="mx-auto inline-flex rounded-2xl bg-rose-500/10 p-4 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">Algo inesperado aconteceu</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ocorreu uma falha na renderização da página. Nossa equipe já monitora a plataforma para evitar instabilidades.
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-left font-mono text-[11px] text-rose-300 max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-xs font-bold text-slate-950 transition"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Recarregar Página</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-5 py-3 text-xs font-semibold text-white transition"
              >
                <Home className="h-4 w-4" />
                <span>Voltar ao Início</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}