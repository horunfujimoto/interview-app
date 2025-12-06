import { Breadcrumb as BootstrapBreadcrumb, type BreadcrumbProps as BootstrapBreadcrumbProps } from 'react-bootstrap';
import classNames from 'classnames';

type BreadcrumbProps = BootstrapBreadcrumbProps & {
  // No custom props needed for now
};

/**
 * Common Breadcrumb Component
 * @param {BreadcrumbProps} props - The props for the component.
 */
export const Breadcrumb = ({ className, children, ...props }: BreadcrumbProps) => {
  const breadcrumbClasses = classNames(className);

  return (
    <BootstrapBreadcrumb className={breadcrumbClasses} {...props}>
      {children}
    </BootstrapBreadcrumb>
  );
};

// Expose sub-components for composition
Breadcrumb.Item = BootstrapBreadcrumb.Item;
