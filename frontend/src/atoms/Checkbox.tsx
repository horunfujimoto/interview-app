import { Form, type FormCheckProps } from 'react-bootstrap';
import classNames from 'classnames';

type CheckboxProps = FormCheckProps;

export const Checkbox = ({ className, ...props }: CheckboxProps) => {
  const checkClasses = classNames(className);

  return <Form.Check className={checkClasses} {...props} />;
};