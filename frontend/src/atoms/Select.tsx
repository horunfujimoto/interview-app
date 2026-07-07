import { Form } from 'react-bootstrap';
import classNames from 'classnames';
import type { FormSelectProps } from 'react-bootstrap';

type SelectOption = {
  value: string | number;
  label: string;
};

type SelectProps = FormSelectProps & {
  options: SelectOption[];
  className?: string;
};

export const Select: React.FC<SelectProps> = ({
  className,
  options,
  ...props
}) => {
  return (
    <Form.Select className={classNames(className)} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Form.Select>
  );
};
