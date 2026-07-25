import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught React UI rendering exception:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('vault_token');
    localStorage.removeItem('vault_user');
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8faf4] flex items-center justify-center p-6 text-[#1C2620]">
          <div className="bg-white border-2 border-[#1C2620] rounded-xl shadow-2xl p-8 max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold">Workspace UI Exception</h2>
            <p className="text-xs font-mono text-[#1C2620]/70 bg-red-50 p-3 rounded border border-red-200 text-left overflow-auto max-h-32">
              {this.state.error?.toString() || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="btn-primary w-full py-3 font-mono text-xs uppercase tracking-wider rounded font-bold shadow flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-white" />
              <span>Reset Session & Reload Vault</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
