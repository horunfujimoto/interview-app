import React, { useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  AIAvatarDisplay,
  InterviewHeader,
  InterviewFooter,
} from '../organisms';
import { QuestionBox, VideoPlayer, HintBox, TimerDisplay } from '../molecules';
import { useInterviewTimers, useMediaStream, useInterviewProcess, useMediaRecorder } from '../hooks';
import { api } from '../lib/api';
import classNames from 'classnames';
import { toast } from 'react-toastify';

const InterviewPage: React.FC = () => {
  const navigate = useNavigate();

  // カスタムフック
  const { totalTime, responseRemainingTime, startTimers, resetResponseTimer } = useInterviewTimers();
  const { stream, isMicActive, error: mediaError } = useMediaStream();
  const { isRecording, startRecording, stopRecording } = useMediaRecorder();
  const {
    interviewId,
    currentQuestionSequence,
    totalQuestions,
    questionTitle,
    questionText,
    timeLimitSec,
    isLoading,
    error: interviewProcessError,
    isUnauthorized,
    submitAnswerAndNext,
    finishInterview,
    hasInterviewFinished,
  } = useInterviewProcess();

  // 質問表示からの経過時間を計測（回答時間として送信する）
  const questionStartedAtRef = useRef<number>(Date.now());
  const isUploadingRef = useRef(false);

  // 初期化: タイマー開始
  useEffect(() => {
    startTimers();
  }, [startTimers]);

  // ストリームが取れたら録画開始
  useEffect(() => {
    if (stream) {
      startRecording(stream);
    }
  }, [stream, startRecording]);

  // 質問が切り替わったら応答タイマーをリセット（質問ごとの制限時間を反映）
  useEffect(() => {
    resetResponseTimer(timeLimitSec);
    questionStartedAtRef.current = Date.now();
  }, [currentQuestionSequence, timeLimitSec, resetResponseTimer]);

  // セッション切れ → ログイン画面へ
  useEffect(() => {
    if (isUnauthorized) {
      toast.error('セッションの有効期限が切れました。再度ログインしてください。');
      navigate('/applicant/login');
    }
  }, [isUnauthorized, navigate]);

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

  // 面接終了時: 録画を停止してアップロードし、終了画面へ
  useEffect(() => {
    if (!hasInterviewFinished || isUploadingRef.current) return;
    isUploadingRef.current = true;

    (async () => {
      try {
        const blob = await stopRecording();
        if (blob && blob.size > 0) {
          const formData = new FormData();
          formData.append('recording', blob, 'recording.webm');
          await api.postForm('/api/interviews/me/recording', formData);
        }
      } catch (err) {
        // アップロード失敗でも応募者の面接体験は完了させる（データはサーバー側ログで追跡）
        console.error('録画アップロードに失敗しました:', err);
        toast.error('録画のアップロードに失敗しました。担当者にご連絡ください。');
      } finally {
        navigate('/applicant/finish');
      }
    })();
  }, [hasInterviewFinished, stopRecording, navigate]);

  const handleNextQuestion = useCallback(async () => {
    const durationSec = Math.round((Date.now() - questionStartedAtRef.current) / 1000);
    await submitAnswerAndNext(durationSec);
  }, [submitAnswerAndNext]);

  const handleFinishInterview = useCallback(async () => {
    if (window.confirm('本当に面接を終了しますか？終了後は自動的に録画がアップロードされます。')) {
      await finishInterview();
    }
  }, [finishInterview]);

  // 初回ロード中はスピナーを表示
  if (isLoading && !questionText && !hasInterviewFinished) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-dark text-white">
        <Spinner animation="border" role="status" className="me-3" />
        <span>面接の準備をしています...</span>
      </div>
    );
  }

  return (
    <div className={classNames('interview-grid', 'd-flex', 'flex-column', 'min-vh-100', 'bg-dark', 'text-white')}>
      {/* ヘッダー */}
      <InterviewHeader
        interviewId={interviewId ?? ''}
        isRecording={isRecording}
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
