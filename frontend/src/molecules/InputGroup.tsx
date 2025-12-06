import { InputGroup as BootstrapInputGroup, type InputGroupProps as BootstrapInputGroupProps } from 'react-bootstrap';
import classNames from 'classnames';
import { type LucideIcon } from 'lucide-react';
import { Input } from '@/atoms';
import type React from 'react';

type InputGroupProps<C extends React.ElementType = 'input'> = BootstrapInputGroupProps & {
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  // Allow passing props to the internal Input component
  inputProps?: Omit<React.ComponentPropsWithoutRef<C>, 'as' | 'className'>;
  as?: C; // The actual component to render inside the input group
};

/**
 * Common InputGroup Component with optional icon.
 * @param {InputGroupProps} props - The props for the component.
 */
export const InputGroup = <C extends React.ElementType = 'input'>({
  icon: Icon,
  iconPosition = 'left',
  className,
  children, // InputGroup can wrap anything, but here we expect an Input
  as,
  inputProps,
  ...props
}: InputGroupProps<C>) => {
  const inputGroupClasses = classNames(className);

  const InputComponent = as || Input; // Default to our Input atom

  return (
    <BootstrapInputGroup className={inputGroupClasses} {...props}>
      {Icon && iconPosition === 'left' && (
        <BootstrapInputGroup.Text>
          <Icon size={18} />
        </BootstrapInputGroup.Text>
      )}
      {children ? children : <InputComponent as={as} {...inputProps} />}
      {Icon && iconPosition === 'right' && (
        <BootstrapInputGroup.Text>
          <Icon size={18} />
        </BootstrapInputGroup.Text>
      )}
    </BootstrapInputGroup>
  );
};
