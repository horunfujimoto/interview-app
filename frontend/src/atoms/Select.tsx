import { Form } from 'react-bootstrap';
import classNames from 'classnames';
import type React from 'react';

type SelectOption = {
  value: string | number;
  label: string;
};

// SelectPropsをForm.Selectのプロップ型そのものに拡張し、optionsを追加
type SelectProps = React.ComponentProps<typeof Form.Select> & {
  options: SelectOption[];
};

/**
 * Common Select/Dropdown Component, a wrapper around React-Bootstrap's Form.Select.
 * This component is polymorphic and can be rendered as different elements
 * using the `as` prop.
 */
export const Select = ({
  className,
  options,
  ...props // as, isInvalid など全てのプロップがここに
}: SelectProps) => {
  return (
    <Form.Select
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
