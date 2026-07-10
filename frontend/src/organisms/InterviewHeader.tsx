import React from 'react';
import { Navbar, Container } from 'react-bootstrap'; // Row, Colを削除
import { Clock } from 'lucide-react';
import { LogoMark } from '@/atoms';
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
  appName = 'Prelude',
  interviewId = '',
  isRecording,
  totalTimeInSeconds,
  className = '',
}) => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className={classNames('p-3', 'shadow-md', 'z-10', className)}>
      <Container fluid>
        <div className="d-flex align-items-center gap-2">
          <LogoMark size={26} />
          <span className="h5 mb-0 fw-bold logo-wordmark">{appName}</span>
          {interviewId && (
            <span className="text-sm text-gray-400 ms-3 d-none d-sm-inline">
              面接ID: <code className="stage-code">{interviewId}</code>
            </span>
          )}
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
