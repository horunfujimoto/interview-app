import { Button as BootstrapButton, type ButtonProps as BootstrapButtonProps } from 'react-bootstrap';
import classNames from 'classnames';
import { type LucideIcon, LoaderCircle } from 'lucide-react'; // Import LoaderCircle

// Define custom props, extending React-Bootstrap's ButtonProps
type ButtonProps = BootstrapButtonProps & {
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean; // Add loading prop
  loadingText?: string; // Add custom loading text prop
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
  loading = false, // Default to false
  loadingText = 'Loading...', // Default loading text
  disabled, // Destructure disabled to control it based on loading state
  ...props
}: ButtonProps) => {
  const buttonClasses = classNames(
    'd-inline-flex',
    'align-items-center',
    className
  );

  return (
    <BootstrapButton
      className={buttonClasses}
      disabled={disabled || loading} // Disable if loading is true
      {...props}
    >
      {loading ? ( // If loading, show spinner and loading text
        <>
          <LoaderCircle size={18} className="me-2 animate-spin" /> {/* Spinner icon */}
          {loadingText}
        </>
      ) : ( // Otherwise, show original icon and children
        <>
          {Icon && iconPosition === 'left' && <Icon size={18} className="me-2" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={18} className="ms-2" />}
        </>
      )}
    </BootstrapButton>
  );
};
