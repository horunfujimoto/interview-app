import { Button as BootstrapButton, type ButtonProps as BootstrapButtonProps } from 'react-bootstrap';
import classNames from 'classnames';
import { type LucideIcon, LoaderCircle } from 'lucide-react';

type ButtonProps = BootstrapButtonProps & {
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  loadingText?: string;
};

export const Button = ({
  children,
  icon: Icon,
  iconPosition = 'left',
  className,
  loading = false,
  loadingText = 'Loading...',
  disabled,
  ...props
}: ButtonProps) => {
  const { isChild, ...safeProps } = props as any; // ← これを追加！

  const buttonClasses = classNames(
    'd-inline-flex',
    'align-items-center',
    className
  );

  return (
    <BootstrapButton
      className={buttonClasses}
      disabled={disabled || loading}
      {...safeProps} // ← DOM へ安全な props だけ渡す
    >
      {loading ? (
        <>
          <LoaderCircle size={18} className="me-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={18} className="me-2" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={18} className="ms-2" />}
        </>
      )}
    </BootstrapButton>
  );
};
