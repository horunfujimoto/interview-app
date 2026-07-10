import classNames from 'classnames';

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * Prelude ロゴマーク（音声波形）。
 * 録画・音声で語る面接プラットフォームであることを示す。
 * currentColor ではなく専用クラスで塗るため、ライト/ダークどちらでも使える。
 */
export const LogoMark = ({ size = 28, className }: LogoMarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    role="img"
    aria-label="Prelude"
    className={classNames('logo-mark', className)}
  >
    <rect width="32" height="32" rx="8" className="logo-mark-bg" />
    <g className="logo-mark-bars">
      <rect x="7" y="13" width="3" height="6" rx="1.5" />
      <rect x="12" y="9" width="3" height="14" rx="1.5" />
      <rect x="17" y="6" width="3" height="20" rx="1.5" />
      <rect x="22" y="11" width="3" height="10" rx="1.5" />
    </g>
  </svg>
);

interface LogoProps {
  size?: number;
  /** ワードマーク（Prelude の文字）を表示するか */
  withText?: boolean;
  /** サブラベル（例: "RECRUITER CONSOLE"）。withText 時のみ表示 */
  sub?: string;
  /** ダーク背景上で使う場合 inverse */
  tone?: 'default' | 'inverse';
  className?: string;
}

/**
 * Prelude ブランドロックアップ（マーク + ワードマーク + サブラベル）。
 */
export const Logo = ({ size = 30, withText = true, sub, tone = 'default', className }: LogoProps) => (
  <span className={classNames('logo-lockup', tone === 'inverse' && 'logo-inverse', className)}>
    <LogoMark size={size} />
    {withText && (
      <span className="logo-text">
        <span className="logo-wordmark">Prelude</span>
        {sub && <span className="logo-sub">{sub}</span>}
      </span>
    )}
  </span>
);
