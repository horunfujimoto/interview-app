import React from 'react';
import { Send, LogOut } from 'lucide-react';
import { ProgressBar } from '@/molecules';
import { Button } from '@/atoms'; // カスタムButtonコンポーネント
import classNames from 'classnames';

interface InterviewFooterProps {
  currentQuestion: number;
  totalQuestions: number;
  onNextQuestion: () => void;
  onFinishInterview: () => void;
  className?: string;
  isNextButtonDisabled?: boolean;
}

/**
 * InterviewFooter Organism
 * AI面接画面のフッター部分（進捗バーとアクションボタン）を表示するコンポーネント。
 * @param {InterviewFooterProps} props - The props for the component.
 */
export const InterviewFooter: React.FC<InterviewFooterProps> = ({
  currentQuestion,
  totalQuestions,
  onNextQuestion,
  onFinishInterview,
  className = '',
  isNextButtonDisabled = false,
}) => {
  return (
    <footer className={classNames('bg-gray-800', 'p-4', 'shadow-2xl', 'd-flex', 'justify-content-between', 'align-items-center', 'z-10', className)}>
      {/* 進捗バー */}
      <div className="w-33 d-flex align-items-center text-sm text-gray-400 d-none d-md-flex">
        <ProgressBar
          currentStep={currentQuestion}
          totalSteps={totalQuestions}
          label="進捗:"
          showText={true}
          variant="primary"
          className="w-100" // ProgressBar内部でw-100を設定済みだが、念のため
        />
      </div>

      {/* アクションボタン */}
      <div className="w-100 w-md-auto d-flex justify-content-center space-x-4">
        <Button
          variant="primary" // カスタムButtonはvariantをpropsで受け取る
          onClick={onNextQuestion}
          className="d-flex align-items-center me-3"
          disabled={isNextButtonDisabled}
        >
          <Send size={20} className="me-2" />
          <span>回答終了 & 次の質問へ</span>
        </Button>
        <Button
          variant="secondary" // カスタムButtonはvariantをpropsで受け取る
          onClick={onFinishInterview}
          className="d-flex align-items-center"
        >
          <LogOut size={20} className="me-2" />
          <span>面接を終了する</span>
        </Button>
      </div>

      {/* スペース調整（モバイル対応） */}
      <div className="w-33 d-none d-md-block"></div>
    </footer>
  );
};
