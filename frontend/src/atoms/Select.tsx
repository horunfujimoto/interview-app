import { Form, type FormSelectProps } from 'react-bootstrap';
import classNames from 'classnames';

type SelectOption = {
  value: string | number;
  label: string;
};

type SelectProps = FormSelectProps & {
  options: SelectOption[];
};

/**
 * Common Select/Dropdown Component
 * @param {SelectProps} props - The props for the component.
 * @returns {JSX.Element}
 */
export const Select = ({ className, options, ...props }: SelectProps) => {
  const selectClasses = classNames(className);

  return (
    <Form.Select className={selectClasses} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Form.Select>
  );
};
