import { Pagination as BootstrapPagination, type PaginationProps as BootstrapPaginationProps } from 'react-bootstrap';
import classNames from 'classnames';

type PaginationProps = BootstrapPaginationProps & {
  // No custom props needed for now
};

/**
 * Common Pagination Component
 * @param {PaginationProps} props - The props for the component.
 */
export const Pagination = ({ className, children, ...props }: PaginationProps) => {
  const paginationClasses = classNames(className);

  return (
    <BootstrapPagination className={paginationClasses} {...props}>
      {children}
    </BootstrapPagination>
  );
};

// Expose sub-components for composition
Pagination.First = BootstrapPagination.First;
Pagination.Prev = BootstrapPagination.Prev;
Pagination.Item = BootstrapPagination.Item;
Pagination.Ellipsis = BootstrapPagination.Ellipsis;
Pagination.Next = BootstrapPagination.Next;
Pagination.Last = BootstrapPagination.Last;
