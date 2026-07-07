import { Form } from 'react-bootstrap';
import classNames from 'classnames';
import type { FormControlProps } from 'react-bootstrap'; // Needed for type extending
import type React from 'react'; // Added for React.TextareaHTMLAttributes

// InputProps is generic on C, and combines props from C with FormControlProps
// This is the structure react-bootstrap expects for polymorphic components
type InputProps<C extends React.ElementType = 'input'> = Omit<React.ComponentProps<C>, keyof FormControlProps | 'className'> & FormControlProps & (
  C extends 'textarea' // If 'as' is 'textarea'
    ? React.TextareaHTMLAttributes<HTMLTextAreaElement> // Allow textarea specific props like 'rows'
    : {} // Otherwise, no additional props
);

export const Input = <C extends React.ElementType = 'input'>({
  as,
  className,
  ...props // isInvalid, type, placeholder etc. are here
}: InputProps<C>) => {
  return (
    <Form.Control
      as={as} // Explicitly pass 'as' prop
      className={classNames(className)}
      {...props}
    />
  );
};
