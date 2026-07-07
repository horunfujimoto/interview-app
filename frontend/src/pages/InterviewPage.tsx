import React, { useEffect, useCallback } from 'react'; // useStateを削除
import { Container, Row, Col } from 'react-bootstrap';
import {
  AIAvatarDisplay,
  InterviewHeader,
  InterviewFooter,
} from '../organisms';
import { QuestionBox, VideoPlayer, HintBox, TimerDisplay } from '../molecules';
import { useInterviewTimers, useMediaStream, useInterviewProcess } from '../hooks';
import classNames from 'classnames';
import { toast } from 'react-toastify'; // エラー表示のためにreact-toastifyを仮定

const InterviewPage: React.FC = () => {
  // ダミーの面接ID (実際にはルーティングパラメータなどから取得)
  const DUMMY_INTERVIEW_ID = '4892-C01-S3';

  // カスタムフック
  const { totalTime, responseRemainingTime, startTimers, resetResponseTimer } = useInterviewTimers();
  const { stream, isMicActive, error: mediaError } = useMediaStream();
  const {
    currentQuestionSequence,
    totalQuestions,
    questionTitle,
    questionText,
    isLoading,
    error: interviewProcessError,
    submitAnswerAndNext,
    finishInterview,
    hasInterviewFinished,
  } = useInterviewProcess(DUMMY_INTERVIEW_ID);

  // 初期化処理
  useEffect(() => {
    // MediaStreamの取得を試みる (useMediaStream内で自動的に行われるが、明示的に呼び出す場合)
    // getMediaStream(); // useMediaStream内で自動的に実行されるため、コメントアウト

    // タイマーを開始
    startTimers();

    return () => {
      // ページを離れる際のクリーンアップ (useInterviewTimers内でclearInterval済み)
    };
  }, [startTimers]);

  // 質問が切り替わったら応答タイマーをリセット
  useEffect(() => {
    resetResponseTimer();
  }, [currentQuestionSequence, resetResponseTimer]);

  // メディアアクセスエラーのトースト表示
  useEffect(() => {
    if (mediaError) {
      toast.error(`メディアアクセスエラー: ${mediaError.message}`);
    }
  }, [mediaError]);

  // 面接処理エラーのトースト表示
  useEffect(() => {
    if (interviewProcessError) {
      toast.error(`面接処理エラー: ${interviewProcessError.message}`);
    }
  }, [interviewProcessError]);

  // 面接終了時の処理
  useEffect(() => {
    if (hasInterviewFinished) {
      // TODO: 面接完了画面へのリダイレクトなど
      console.log('面接が完全に終了しました。');
    }
  }, [hasInterviewFinished]);

  const handleNextQuestion = useCallback(async () => {
    await submitAnswerAndNext();
  }, [submitAnswerAndNext]);

  const handleFinishInterview = useCallback(async () => {
    if (window.confirm('本当に面接を終了しますか？終了後は自動的に録画がアップロードされます。')) {
      await finishInterview();
    }
  }, [finishInterview]);


  return (
    <div className={classNames('interview-grid', 'd-flex', 'flex-column', 'min-vh-100', 'bg-dark', 'text-white')}>
      {/* ヘッダー */}
      <InterviewHeader
        interviewId={DUMMY_INTERVIEW_ID}
        isRecording={true} // TODO: 録画ステータスをuseMediaStreamから取得
        totalTimeInSeconds={totalTime}
      />

      {/* メインコンテンツ */}
      <Container fluid className="flex-grow-1 p-4 overflow-auto">
        <Row className={classNames('g-4', 'h-100', 'main-content-area', 'md:grid-cols-3')}>
          {/* 左側: AI面接官（アバター＆質問表示） */}
          <Col md={8} className="d-flex flex-column space-y-4">
            {/* AIアバター表示エリア */}
            <AIAvatarDisplay />

            {/* 質問テキストボックス */}
            <QuestionBox
              questionSequence={currentQuestionSequence}
              questionTitle={questionTitle}
              questionText={questionText}
            />
          </Col>

          {/* 右側: 応募者ビデオ & ステータス */}
          <Col md={4} className="d-flex flex-column space-y-4">
            {/* 応募者ビデオエリア */}
            <VideoPlayer stream={stream} isMicActive={isMicActive} />

            {/* 応答タイマーとヒント */}
            <div className="bg-gray-700 p-4 rounded-xl shadow-lg border border-gray-600">
              <div className="text-center mb-3">
                <p className="text-sm font-weight-medium text-gray-400">現在の質問に対する残り応答時間</p>
                <div className={classNames(
                  'text-6xl', 'font-weight-extrabold', 'mt-1',
                  responseRemainingTime <= 10 ? 'text-danger' : 'text-primary-blue'
                )}>
                  <TimerDisplay timeInSeconds={responseRemainingTime} format="mm:ss" />
                </div>
              </div>
              <HintBox message="質問に答えるときは、カメラを見て、ハキハキと話しましょう。" />
            </div>
          </Col>
        </Row>
      </Container>

      {/* フッター */}
      <InterviewFooter
        currentQuestion={currentQuestionSequence}
        totalQuestions={totalQuestions}
        onNextQuestion={handleNextQuestion}
        onFinishInterview={handleFinishInterview}
        isNextButtonDisabled={isLoading}
      />
    </div>
  );
};

export default InterviewPage;