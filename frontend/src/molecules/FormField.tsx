import { Form } from 'react-bootstrap';
import { Input, Label } from '@/atoms';
import React from 'react';

// Use a more flexible generic approach for props
type FormFieldProps<C extends React.ElementType> = {
  label: string;
  error?: string;
  description?: string;
  controlId: string;
  as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, 'as'>;


export const FormField = <C extends React.ElementType = typeof Input>({
  label,
  error,
  description,
  controlId,
  as,
  ...props
}: FormFieldProps<C>) => {
  const Component = as || Input;

  return (
    <Form.Group controlId={controlId}>
      <Label>{label}</Label>
      <Component {...props} isInvalid={!!error} />
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
      {description && !error && <Form.Text muted>{description}</Form.Text>}
    </Form.Group>
  );
};
