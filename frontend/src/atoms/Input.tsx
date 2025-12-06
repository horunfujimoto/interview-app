import { Form } from 'react-bootstrap';
import classNames from 'classnames';
import type React from 'react';
import type { FormControlProps } from 'react-bootstrap'; // Needed for type extending

// InputProps is generic on C, and combines props from C with FormControlProps
// This is the structure react-bootstrap expects for polymorphic components
type InputProps<C extends React.ElementType = 'input'> = Omit<React.ComponentProps<C>, keyof FormControlProps | 'as' | 'className'> & FormControlProps & {
  as?: C;
};

export const Input = <C extends React.ElementType = 'input'>({
  as,
  className,
  ...props // isInvalid, type, placeholder etc. are here
}: InputProps<C>) => {
  return (
    <Form.Control
      className={classNames(className)}
      {...props}
    />
  );
};
