import React from 'react';
import { Badge } from '@/atoms';

interface TimerDisplayProps {
  timeInSeconds: number;
  format?: 'HH:mm:ss' | 'mm:ss';
  className?: string;
  badge?: boolean;
}

/**
 * TimerDisplay Molecule
 * 時間（秒）を受け取り、指定されたフォーマットで表示するコンポーネント。
 * オプションでBadgeとして表示することも可能。
 * @param {TimerDisplayProps} props - The props for the component.
 */
export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeInSeconds,
  format = 'mm:ss',
  className = '',
  badge = false,
}) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;

  const formattedTime = React.useMemo(() => {
    const pad = (num: number) => String(num).padStart(2, '0');
    if (format === 'HH:mm:ss') {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }, [format, hours, minutes, seconds]); // timeInSecondsを削除し、hours, minutes, secondsを追加

  if (badge) {
    return <Badge bg="secondary" className={className}>{formattedTime}</Badge>;
  }

  return <span className={className}>{formattedTime}</span>;
};
