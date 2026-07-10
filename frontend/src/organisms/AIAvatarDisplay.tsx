import React from 'react';
import { Card } from 'react-bootstrap';
import classNames from 'classnames';

interface AIAvatarDisplayProps {
  avatarName?: string;
  /** 発話中はバーが動く（将来 TTS 連携時に使用） */
  isSpeaking?: boolean;
  className?: string;
}

/**
 * AIAvatarDisplay Organism
 * AI面接官の存在を示す「波形オーブ」。
 * 声で応対する存在であることを、顔ではなく音声波形のメタファーで表現する。
 */
export const AIAvatarDisplay: React.FC<AIAvatarDisplayProps> = ({
  avatarName = 'AI面接官',
  isSpeaking = true,
  className = '',
}) => {
  return (
    <Card className={classNames(
      'ai-avatar-box',
      'p-8',
      'd-flex',
      'flex-column',
      'align-items-center',
      'justify-content-center',
      'h-64',
      className
    )}>
      <div className={classNames('ai-orb', isSpeaking && 'is-speaking')} role="img" aria-label={avatarName}>
        <span className="ai-orb-bar" />
        <span className="ai-orb-bar" />
        <span className="ai-orb-bar" />
        <span className="ai-orb-bar" />
        <span className="ai-orb-bar" />
      </div>
      <p className="mt-4 text-gray-200 text-lg font-weight-semibold mb-0">{avatarName}</p>
    </Card>
  );
};
