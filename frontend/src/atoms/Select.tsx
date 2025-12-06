import { Form } from 'react-bootstrap';
import classNames from 'classnames';
import type React from 'react';
import type { FormSelectProps } from 'react-bootstrap'; // Needed for type extending

type SelectOption = {
  value: string | number;
  label: string;
};

// SelectProps is generic on C, and combines props from C with FormSelectProps
// This is the structure react-bootstrap expects for polymorphic components
type SelectProps<C extends React.ElementType = 'select'> = Omit<React.ComponentProps<C>, keyof FormSelectProps | 'as' | 'className'> & FormSelectProps & {
  as?: C;
  options: SelectOption[]; // This prop is specific to our Select component
};

export const Select = <C extends React.ElementType = 'select'>({
  as,
  className,
  options,
  ...props // isInvalid etc. are here
}: SelectProps<C>) => {
  return (
    <Form.Select
      as={as}
      className={classNames(className)}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Form.Select>
  );
};
