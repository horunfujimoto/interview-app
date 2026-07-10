import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * 描画中の未処理例外で画面が真っ白になるのを防ぐ最後の砦。
 * 面接中のクラッシュでも応募者が「再読み込み」で復帰できるようにする
 * （録画はチャンク逐次アップロード方式のため、送信済み分は保全されている）。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 収集基盤（Sentry等）導入時はここに送信処理を足す
    console.error('描画中の未処理エラー:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
        <div className="text-center p-4">
          <h1 className="h4 mb-3">問題が発生しました</h1>
          <p className="text-muted mb-4">
            画面の表示中にエラーが発生しました。
            <br />
            再読み込みすると続きから再開できます。
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            再読み込み
          </button>
        </div>
      </div>
    );
  }
}
