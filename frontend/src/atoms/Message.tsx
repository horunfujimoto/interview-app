import { Alert, type AlertProps } from 'react-bootstrap';
import classNames from 'classnames';

type MessageProps = AlertProps & {
  // No custom props needed for now
};

/**
 * Common Message/Alert Component
 * @param {MessageProps} props - The props for the component.
 * @returns {JSX.Element | null}
 */
export const Message = ({ className, children, show = true, ...props }: MessageProps) => {
  if (!show) {
    return null;
  }

  const messageClasses = classNames(className);

  return (
    <Alert className={messageClasses} {...props}>
      {children}
    </Alert>
  );
};
