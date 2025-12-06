import { Badge as BootstrapBadge } from 'react-bootstrap';
import classNames from 'classnames';
import type React from 'react';

type BadgeProps = React.ComponentProps<typeof BootstrapBadge> & {
  // No custom props needed for now
};

/**
 * Common Badge Component
 * @param {BadgeProps} props - The props for the component.
 */
export const Badge = ({ className, ...props }: BadgeProps) => {
  const badgeClasses = classNames(className);

  return <BootstrapBadge className={badgeClasses} {...props} />;
};
