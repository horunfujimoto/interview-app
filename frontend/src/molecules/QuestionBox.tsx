import React from 'react';
import { Card } from 'react-bootstrap';
import classNames from 'classnames';

interface QuestionBoxProps {
  questionSequence: number;
  questionTitle: string;
  questionText: string;
  className?: string;
}

/**
 * QuestionBox Molecule
 * AI面接官からの質問（Q番号、タイトル、テキスト）を表示するコンポーネント。
 * @param {QuestionBoxProps} props - The props for the component.
 */
export const QuestionBox: React.FC<QuestionBoxProps> = ({
  questionSequence,
  questionTitle,
  questionText,
  className = '',
}) => {
  return (
    <Card className={classNames('prompt-text', 'bg-gray-700', 'p-6', 'rounded-xl', 'shadow-xl', 'border-l-4', 'border-primary-blue', className)}>
      <Card.Body>
        <h2 className="text-xl font-bold text-white mb-2 flex items-center">
          <span className="text-3xl font-extrabold text-primary-blue mr-3">Q{questionSequence}.</span>
          <span id="questionTitle">{questionTitle}</span>
        </h2>
        <p className="text-gray-300 leading-relaxed text-lg">
          {questionText}
        </p>
      </Card.Body>
    </Card>
  );
};
