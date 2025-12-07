import { useState, useCallback, useMemo } from 'react';

// モックデータと関数 (実際にはAPI呼び出しに置き換える)
const MOCK_QUESTIONS = [
  {
    sequence: 1,
    title: 'AI面接官からの質問',
    text: 'あなたのこれまでのキャリアの中で、最も大きな困難は何でしたか？また、それをどのように乗り越えましたか？ 具体的な例を挙げて説明してください。',
  },
  {
    sequence: 2,
    title: 'AI面接官からの質問',
    text: 'その困難を乗り越える過程で、チームメンバーとはどのように連携しましたか？（追質問）',
  },
  {
    sequence: 3,
    title: 'AI面接官からの質問',
    text: '当社を志望された理由と、あなたが当社で成し遂げたいことを教えてください。',
  },
  {
    sequence: 4,
    title: 'AI面接官からの質問',
    text: 'ご自身の強みと弱みを教えてください。また、それぞれの具体的なエピソードを交えて説明してください。',
  },
  {
    sequence: 5,
    title: 'AI面接官からの質問',
    text: 'あなたはストレスを感じた時、どのように対処していますか？具体的な方法があれば教えてください。',
  },
  {
    sequence: 6,
    title: 'AI面接官からの質問',
    text: 'もし当社の製品やサービスについて改善点があるとしたら、どのような点を提案しますか？',
  },
  {
    sequence: 7,
    title: 'AI面接官からの質問',
    text: 'あなたはチームで働くことと、個人で働くことのどちらにやりがいを感じますか？理由も教えてください。',
  },
  {
    sequence: 8,
    title: 'AI面接官からの質問',
    text: '10年後、あなたはどのような自分になっていたいですか？また、そのために何をしますか？',
  },
  {
    sequence: 9,
    title: 'AI面接官からの質問',
    text: 'これまでの経験で、最も成功したプロジェクトと失敗したプロジェクトを教えてください。そこから何を学びましたか？',
  },
  {
    sequence: 10,
    title: 'AI面接官からの質問',
    text: '最後に、AI面接官に何か質問はありますか？',
  },
];

interface UseInterviewProcess {
  currentQuestionSequence: number;
  totalQuestions: number;
  questionTitle: string;
  questionText: string;
  isLoading: boolean;
  error: Error | null;
  submitAnswerAndNext: () => Promise<void>;
  finishInterview: () => Promise<void>;
  hasInterviewFinished: boolean;
}

/**
 * useInterviewProcess Custom Hook
 * 質問の進行、回答の送信、面接終了などのロジックを管理するカスタムフック。
 * モック化されたAPI呼び出しを含む。
 * @param {string} interviewId - 面接ID
 * @returns {UseInterviewProcess} currentQuestionSequence, totalQuestions, questionTitle, questionText, isLoading, error, submitAnswerAndNext, finishInterview, hasInterviewFinished
 */
export const useInterviewProcess = (interviewId: string): UseInterviewProcess => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0); // 0-indexed
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasInterviewFinished, setHasInterviewFinished] = useState<boolean>(false);

  const totalQuestions = MOCK_QUESTIONS.length;
  const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];

  const questionTitle = useMemo(() => currentQuestion?.title || '', [currentQuestion]);
  const questionText = useMemo(() => currentQuestion?.text || '', [currentQuestion]);
  const currentQuestionSequence = useMemo(() => currentQuestion?.sequence || 0, [currentQuestion]);

  const finishInterview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: 実際のAPI呼び出しに置き換える
      console.log(`[${interviewId}] 面接を終了します...`);
      // MediaRecorderを停止し、録画データをアップロードするAPI (mock)
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒の遅延をシミュレート

      alert('面接を終了しました。録画データのアップロードが開始されます。(デモ)');
      setHasInterviewFinished(true); // 面接終了フラグを立てる
      // TODO: 完了画面へのリダイレクトなどの処理
    } catch (err) {
      console.error('面接終了処理に失敗しました:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [interviewId]);

  const submitAnswerAndNext = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: 実際のAPI呼び出しに置き換える
      console.log(`[${interviewId}] Q${currentQuestionSequence} の回答を送信します...`);
      // 例えば、回答データをサーバーに送信するAPI (mock)
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒の遅延をシミュレート

      if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        console.log('次の質問へ進みます。');
      } else {
        console.log('すべての質問が終了しました。');
        await finishInterview(); // 最後の質問の場合、自動的に面接終了
      }
    } catch (err) {
      console.error('回答送信または次の質問取得に失敗しました:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [interviewId, currentQuestionSequence, currentQuestionIndex, finishInterview]);

  return {
    currentQuestionSequence,
    totalQuestions,
    questionTitle,
    questionText,
    isLoading,
    error,
    submitAnswerAndNext,
    finishInterview,
    hasInterviewFinished,
  };
};
