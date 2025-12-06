import { Badge as BootstrapBadge, BadgeProps as BootstrapBadgeProps } from 'react-bootstrap';
import classNames from 'classnames';

type BadgeProps = BootstrapBadgeProps & {
  // No custom props needed for now
};

/**
 * Common Badge Component
 * @param {BadgeProps} props - The props for the component.
 * @returns {JSX.Element}
 */
export const Badge = ({ className, ...props }: BadgeProps): JSX.Element => {
  const badgeClasses = classNames(className);

  return <BootstrapBadge className={badgeClasses} {...props} />;
};
