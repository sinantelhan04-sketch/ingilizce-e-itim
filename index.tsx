import React, { Component, ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#FEF2F2', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: '#DC2626', fontSize: '2rem', marginBottom: '1rem' }}>Uygulama Yüklenemedi</h1>
          <p style={{ color: '#4B5563', maxWidth: '500px', lineHeight: '1.6' }}>
            Beklenmedik bir hata oluştu. Genellikle bu durum API anahtarının eksik olmasından kaynaklanır.
          </p>
          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff', borderRadius: '0.5rem', border: '1px solid #FECACA', color: '#EF4444', fontFamily: 'monospace' }}>
            {this.state.error?.message || "Bilinmeyen Hata"}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '2rem', padding: '0.75rem 2rem', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);