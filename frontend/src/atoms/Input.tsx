import { Form } from 'react-bootstrap';
import classNames from 'classnames';
import type React from 'react';

// InputPropsをForm.Controlのプロップ型そのものにする
type InputProps = React.ComponentProps<typeof Form.Control>;

/**
 * Common Input Component, a wrapper around React-Bootstrap's Form.Control.
 * This component is polymorphic and can be rendered as different elements
 * using the `as` prop.
 */
export const Input = ({
  className,
  ...props // as, isInvalid など全てのプロップがここに
}: InputProps) => {
  return (
    <Form.Control
      className={classNames(className)}
      {...props}
    />
  );
};
