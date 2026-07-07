import React from 'react';
import { Navbar, Container } from 'react-bootstrap'; // Row, Colを削除
import { Rabbit, Clock } from 'lucide-react';
import { TimerDisplay } from '@/molecules';
import classNames from 'classnames';

interface InterviewHeaderProps {
  appName?: string;
  interviewId?: string;
  isRecording: boolean;
  totalTimeInSeconds: number;
  className?: string;
}

/**
 * InterviewHeader Organism
 * AI面接画面のヘッダー部分（ロゴ、面接ID、録画ステータス、総経過時間）を表示するコンポーネント。
 * @param {InterviewHeaderProps} props - The props for the component.
 */
export const InterviewHeader: React.FC<InterviewHeaderProps> = ({
  appName = 'AI 面接',
  interviewId = '4892-C01-S3',
  isRecording,
  totalTimeInSeconds,
  className = '',
}) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className={classNames('p-3', 'shadow-md', 'z-10', className)}>
      <Container fluid>
        <div className="d-flex align-items-center space-x-2">
          <Rabbit size={24} className="text-primary-blue me-2" />
          <span className="h4 mb-0 font-weight-bold">{appName}</span>
          <span className="text-sm font-weight-light text-gray-300 ms-4 d-none d-sm-inline">
            | 面接ID: {interviewId}
          </span>
        </div>
        <div className="d-flex align-items-center space-x-4">
          {/* 録画ステータス */}
          <div className="d-flex align-items-center space-x-2 text-sm text-red-400 font-weight-semibold">
            {isRecording && <div className="w-3 h-3 bg-danger rounded-circle animate-pulse"></div>}
            <span>{isRecording ? '録画中' : '待機中'}</span>
          </div>
          {/* 総経過時間 */}
          <div className="d-flex align-items-center space-x-1 text-sm text-gray-200">
            <Clock size={16} className="me-1" />
            <TimerDisplay timeInSeconds={totalTimeInSeconds} format="HH:mm:ss" />
          </div>
        </div>
      </Container>
    </Navbar>
  );
};
