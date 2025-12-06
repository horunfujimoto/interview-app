import { Card as BootstrapCard, type CardProps as BootstrapCardProps } from 'react-bootstrap';
import classNames from 'classnames';

type CardProps = BootstrapCardProps & {
  // No custom props needed for now
};

/**
 * Common Card Component
 * @param {CardProps} props - The props for the component.
 * @returns {JSX.Element}
 */
export const Card = ({ className, children, ...props }: CardProps) => {
  const cardClasses = classNames(className);

  return (
    <BootstrapCard className={cardClasses} {...props}>
      {children}
    </BootstrapCard>
  );
};

// For composition, we can attach sub-components like this.
Card.Header = BootstrapCard.Header;
Card.Body = BootstrapCard.Body;
Card.Footer = BootstrapCard.Footer;
Card.Title = BootstrapCard.Title;
Card.Text = BootstrapCard.Text;
Card.Img = BootstrapCard.Img;
