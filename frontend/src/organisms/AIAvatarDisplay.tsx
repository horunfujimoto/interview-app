import React from 'react';
import { Card } from 'react-bootstrap';
import classNames from 'classnames';
import { type LucideIcon } from 'lucide-react'; // Rabbitを削除

interface AIAvatarDisplayProps {
  avatarIcon?: LucideIcon | string; // Lucide Icon または絵文字などの文字列
  avatarName?: string;
  className?: string;
}

/**
 * AIAvatarDisplay Organism
 * AIアバターと名前を表示するコンポーネント。
 * @param {AIAvatarDisplayProps} props - The props for the component.
 */
export const AIAvatarDisplay: React.FC<AIAvatarDisplayProps> = ({
  avatarIcon: AvatarIconOrString = '🐇', // デフォルトは絵文字
  avatarName = 'AI面接官（ラビット）',
  className = '',
}) => {
  const isLucideIcon = typeof AvatarIconOrString !== 'string';

  return (
    <Card className={classNames(
      'ai-avatar-box', // App.cssで定義
      'p-8',
      'rounded-xl',
      'shadow-lg',
      'd-flex',
      'flex-column',
      'align-items-center',
      'justify-content-center',
      'h-64',
      className
    )}>
      {isLucideIcon ? (
        // LucideIconの場合
        <AvatarIconOrString size={80} className="avatar-icon text-primary-blue" />
      ) : (
        // 絵文字などの文字列の場合
        <span className="avatar-icon" role="img" aria-label="Avatar">{AvatarIconOrString}</span>
      )}
      <p className="mt-4 text-gray-200 text-lg font-weight-semibold">{avatarName}</p>
    </Card>
  );
};
