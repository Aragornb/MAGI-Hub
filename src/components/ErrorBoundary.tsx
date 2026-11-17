import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCw, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('[NERV ERROR BOUNDARY CAPTURED EXCEPTION]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#070504] font-mono text-[#ffca8a] select-none">
          <div className="w-full max-w-2xl bg-[#0e0906] border-2 border-[#ff2233] p-6 shadow-[0_0_50px_rgba(255,34,51,0.5)] flex flex-col gap-4">
            <div className="h-2 w-full bg-repeating-linear-gradient" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #ff2233, #ff2233 10px, #000 10px, #000 20px)'
            }} />
            
            <div className="flex items-center gap-3 border-b border-[#3a1417] pb-3 text-[#ff2233]">
              <AlertOctagon className="w-8 h-8 animate-pulse shrink-0" />
              <div>
                <h1 className="text-base font-black tracking-widest uppercase">
                  NERV CENTRAL DOGMA // RECUPERAÇÃO DE EXCEÇÃO
                </h1>
                <p className="text-xs text-[#8a5555]">
                  Falha evitada: a interface impediu o encerramento do sistema (Black Screen Shield).
                </p>
              </div>
            </div>

            <div className="bg-[#050302] border border-[#2d1214] p-3 text-xs leading-relaxed max-h-48 overflow-y-auto select-text text-[#ff8888]">
              <div className="font-bold mb-1 text-[#ff2233]">DETALHES DO ERRO:</div>
              <div>{this.state.error?.message || 'Erro de renderização desconhecido.'}</div>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] text-[#7a4444] mt-2 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack.slice(0, 500)}
                </pre>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-[#7a5a3a] flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5" />
                MAGI SYSTEM 2.0 PROTOCOL DEFENSE ACTIVE
              </span>

              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#ff2233] hover:bg-white text-black font-black text-xs flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(255,34,51,0.6)]"
              >
                <RotateCw className="w-4 h-4" />
                <span>REINICIALIZAR INTERFACE TÁTICA</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
