import { Table as BootstrapTable, type TableProps as BootstrapTableProps } from 'react-bootstrap';
import classNames from 'classnames';

type TableProps = BootstrapTableProps & {
  // No custom props needed for now
};

/**
 * Common Table Component
 * @param {TableProps} props - The props for the component.
 */
export const Table = ({ className, children, ...props }: TableProps) => {
  const tableClasses = classNames(className);

  return (
    <BootstrapTable className={tableClasses} {...props}>
      {children}
    </BootstrapTable>
  );
};
