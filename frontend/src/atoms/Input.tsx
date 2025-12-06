import { Form } from 'react-bootstrap';
import classNames from 'classnames';
import type React from 'react';

// Make the component generic over the element type, defaulting to 'input'.
type InputProps<C extends React.ElementType> = {
  as?: C;
  className?: string;
  isInvalid?: boolean;
} & Omit<React.ComponentPropsWithoutRef<C>, 'as' | 'className'>;

/**
 * Common Input Component, a wrapper around React-Bootstrap's Form.Control.
 * This component is polymorphic and can be rendered as different elements
 * using the `as` prop.
 */
export const Input = <C extends React.ElementType = 'input'>({
  as,
  className,
  ...props
}: InputProps<C>) => {
  return (
    <Form.Control
      as={as}
      className={classNames(className)}
      {...props}
    />
  );
};
