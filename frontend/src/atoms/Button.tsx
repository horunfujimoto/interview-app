import { Button as BootstrapButton, type ButtonProps as BootstrapButtonProps } from 'react-bootstrap';
import classNames from 'classnames';
import { type LucideIcon } from 'lucide-react';

// Define custom props, extending React-Bootstrap's ButtonProps
type ButtonProps = BootstrapButtonProps & {
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
};

/**
 * Common Button Component
 * @param {ButtonProps} props - The props for the component.
 * @returns {JSX.Element}
 */
export const Button = ({
  children,
  icon: Icon,
  iconPosition = 'left',
  className,
  ...props
}: ButtonProps) => {
  const buttonClasses = classNames(
    'd-inline-flex',
    'align-items-center',
    className
  );

  return (
    <BootstrapButton className={buttonClasses} {...props}>
      {Icon && iconPosition === 'left' && <Icon size={18} className="me-2" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={18} className="ms-2" />}
    </BootstrapButton>
  );
};
