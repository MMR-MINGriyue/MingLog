import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
  hasError: false,
  error: undefined,
  errorInfo: undefined
}

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  console.error('Error caught by ErrorBoundary:', error, errorInfo);
  this.setState({ error, errorInfo });
}

  public render(): ReactNode {
  if (this.state.hasError) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        {this.props.fallback}
        {this.state.error && (
          <div style={{ marginTop: '10px', fontSize: '14px' }}>
            <p>错误信息: {this.state.error.message}</p>
            {this.state.error.stack && <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.stack}</pre>}
          </div>
        )}
      </div>
    );
  }
  return this.props.children;
}
}

export default ErrorBoundary;