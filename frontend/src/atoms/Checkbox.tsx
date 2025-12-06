import { Form, type FormCheckProps } from 'react-bootstrap';
import classNames from 'classnames';

type CheckboxProps = FormCheckProps & {
  // No custom props needed for now
};

/**
 * Common Checkbox Component
 * @param {CheckboxProps} props - The props for the component.
 * @returns {JSX.Element}
 */
export const Checkbox = ({ className, ...props }: CheckboxProps) => {
  const checkClasses = classNames(className);

  return <Form.Check className={checkClasses} {...props} />;
};
