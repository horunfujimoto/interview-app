import classNames from 'classnames';
import type { HTMLAttributes, ReactNode } from 'react';
import type React from 'react'; // Explicitly import React for React.ElementType

type TitleProps = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLHeadingElement>;

/**
 * Common Title Component (h1, h2, etc.)
 * @param {TitleProps} props - The props for the component.
 * @returns {JSX.Element}
 */
export const Title = ({ level, children, className, ...props }: TitleProps) => {
  const Tag: React.ElementType = `h${level}`; // Explicitly type as React.ElementType
  const titleClasses = classNames(
    'fw-bold', // Bootstrap class for bold font
    className
  );

  return (
    <Tag className={titleClasses} {...props}>
      {children}
    </Tag>
  );
};
