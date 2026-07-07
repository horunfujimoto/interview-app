import React from 'react';
import { Card } from 'react-bootstrap';
import { type LucideIcon, Lightbulb } from 'lucide-react';
import classNames from 'classnames';

interface HintBoxProps {
  message: string;
  icon?: LucideIcon;
  className?: string;
}

/**
 * HintBox Molecule
 * 面接中のヒントメッセージを表示するコンポーネント。
 * @param {HintBoxProps} props - The props for the component.
 */
export const HintBox: React.FC<HintBoxProps> = ({
  message,
  icon: Icon = Lightbulb, // デフォルトアイコンをLightbulbに設定
  className = '',
}) => {
  return (
    <Card className={classNames('bg-gray-800', 'p-3', 'rounded-lg', 'text-sm', 'text-gray-300', 'border', 'border-gray-600', className)}>
      <Card.Body className="d-flex align-items-center p-0">
        <Icon size={16} className="me-2 text-warning" />
        <span>{message}</span>
      </Card.Body>
    </Card>
  );
};
