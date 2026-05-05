import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-mono relative overflow-hidden selection:bg-red-500/30">
          <div className="absolute inset-0 bg-red-950/10 pointer-events-none"></div>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
          
          <div className="border border-red-500/30 bg-black/80 backdrop-blur p-8 max-w-4xl w-full relative z-10 rounded shadow-[0_0_50px_rgba(239,68,68,0.1)]">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-red-500/20">
              <div className="w-12 h-12 rounded bg-red-500/10 flex items-center justify-center border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              </div>
              <div>
                <h1 id="error-boundary-msg" className="text-xl text-red-500 font-bold uppercase tracking-[0.2em] m-0 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">Critical System Failure</h1>
                <div className="text-xs text-red-400/60 uppercase tracking-widest mt-1">Terminal connection lost • Fatal exception occurred</div>
              </div>
            </div>
            
            <div className="bg-[#050000] border border-red-500/20 p-5 rounded text-xs font-mono overflow-auto max-h-[400px] mb-6 custom-scrollbar relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0"></div>
              <pre className="text-red-400 mb-4 whitespace-pre-wrap font-bold">{this.state.error && this.state.error.toString()}</pre>
              <pre className="text-gray-500 whitespace-pre-wrap text-[10px] leading-relaxed">{this.state.error && this.state.error.stack}</pre>
            </div>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-400 uppercase tracking-[0.3em] font-bold text-xs transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              Initialize System Reboot
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
