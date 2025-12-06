import { InputGroup as BootstrapInputGroup, type InputGroupProps as BootstrapInputGroupProps } from 'react-bootstrap';
import classNames from 'classnames';
import { type LucideIcon } from 'lucide-react';
import { Input } from '@/atoms';
import type React from 'react';

type InputGroupProps<C extends React.ElementType = 'input'> = BootstrapInputGroupProps & {
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  // Allow passing props to the internal Input component
  inputProps?: Omit<React.ComponentPropsWithoutRef<C>, 'as' | 'className' | 'isInvalid'> & { isInvalid?: boolean }; // Add isInvalid to inputProps
  as?: C; // The actual component to render inside the input group
  isInvalid?: boolean; // InputGroup itself accepts isInvalid
};

/**
 * Common InputGroup Component with optional icon.
 * @param {InputGroupProps} props - The props for the component.
 */
export const InputGroup = <C extends React.ElementType = 'input'>({
  icon: Icon,
  iconPosition = 'left',
  className,
  children,
  as,
  inputProps,
  isInvalid, // Destructure isInvalid here
  ...restInputGroupProps // Rest of the props for BootstrapInputGroup
}: InputGroupProps<C>) => {
  const inputGroupClasses = classNames(className);

  const InputComponent = as || Input; // Default to our Input atom

  // Merge isInvalid from InputGroup props into inputProps for InputComponent
  const finalInputProps = { ...inputProps, isInvalid: isInvalid };

  return (
    <BootstrapInputGroup className={inputGroupClasses} {...restInputGroupProps}>
      {Icon && iconPosition === 'left' && (
        <BootstrapInputGroup.Text>
          <Icon size={18} />
        </BootstrapInputGroup.Text>
      )}
      {children ? children : <InputComponent as={as} {...finalInputProps} />}
      {Icon && iconPosition === 'right' && (
        <BootstrapInputGroup.Text>
          <Icon size={18} />
        </BootstrapInputGroup.Text>
      )}
    </BootstrapInputGroup>
  );
};
