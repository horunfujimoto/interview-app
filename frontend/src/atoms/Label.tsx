import { FormLabel as BootstrapLabel, type FormLabelProps } from 'react-bootstrap';
import classNames from 'classnames';

type LabelProps = FormLabelProps & {
  // No custom props needed for now
};

/**
 * Common Label Component
 * @param {LabelProps} props - The props for the component.
 * @returns {JSX.Element}
 */
export const Label = ({ className, ...props }: LabelProps) => {
  const labelClasses = classNames(className);

  return <BootstrapLabel className={labelClasses} {...props} />;
};
