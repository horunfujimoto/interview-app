import { Form } from 'react-bootstrap';
import classNames from 'classnames';
import type { FormControlProps } from 'react-bootstrap'; // Needed for type extending
import type React from 'react'; // Added for React.TextareaHTMLAttributes

// InputProps is generic on C, and combines props from C with FormControlProps
// `as` を C として宣言することで <Input as="textarea" rows={3}> のように
// 要素固有の props（rows 等）が型推論される
type InputProps<C extends React.ElementType = 'input'> =
  Omit<React.ComponentProps<C>, keyof FormControlProps | 'className'> &
  Omit<FormControlProps, 'as'> & { as?: C };

export const Input = <C extends React.ElementType = 'input'>({
  as,
  className,
  ...props // isInvalid, type, placeholder etc. are here
}: InputProps<C>) => {
  return (
    <Form.Control
      as={as as React.ElementType} // Explicitly pass 'as' prop
      className={classNames(className)}
      {...(props as FormControlProps)}
    />
  );
};
