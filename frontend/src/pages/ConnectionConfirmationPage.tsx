import React, { useEffect, useState, useCallback } from 'react';
import { Card, Container, Row, Col, Form as BootstrapForm } from 'react-bootstrap';
import { Video, FileText, RefreshCcw, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Title, Button, Checkbox } from '@/atoms';
import { CameraPreview, MicrophoneLevelIndicator } from '@/molecules';
import { useMediaStream } from '@/hooks'; // useMediaStreamをインポート
import { api, ApiError } from '../lib/api';
import classNames from 'classnames';

export const ConnectionConfirmationPage = () => {
  const navigate = useNavigate();
  const [consentChecked, setConsentChecked] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // 面接開始: サーバーの状態を IN_PROGRESS にしてから面接画面へ遷移する
  const onStartInterview = useCallback(async () => {
    setIsStarting(true);
    try {
      await api.post('/api/interviews/me/start');
      navigate('/applicant/interview');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error('セッションの有効期限が切れました。再度ログインしてください。');
        navigate('/applicant/login');
      } else {
        toast.error(err instanceof ApiError ? err.message : '面接を開始できませんでした。');
      }
      setIsStarting(false);
    }
  }, [navigate]);

  // useMediaStreamフックを使用
  const { stream, isMicActive, error: mediaAccessError, getMediaStream } = useMediaStream();

  // CameraPreviewとMicrophoneLevelIndicatorに渡すエラー状態を計算
  const cameraError = !!mediaAccessError; // メディアアクセスエラーがあればカメラエラーとする
  const micError = isMicActive === null || !!mediaAccessError; // マイクがnullまたはメディアアクセスエラーがあればマイクエラーとする

  // TODO: `primary-blue-text`をCSS変数またはBootstrapテーマで定義するか、適切なTailwind/Bootstrapクラスに置き換える
  const primaryBlueText = "text-primary-blue"; // 仮のクラス名

  useEffect(() => {
    // `useMediaStream`フックが自動的にメディアストリームの取得を試みるため、ここでの明示的な呼び出しは不要
    // 必要であれば、`getMediaStream()`を呼んで再試行をトリガーできる
  }, []);

  const isReadyToStart = stream !== null && !cameraError && !micError && consentChecked && !isStarting;

  return (
    <Container fluid className="page-centered">
      <Card className="overflow-hidden" style={{ maxWidth: '900px', width: '100%' }}>
        <Row className="g-0">
          <Col md={12} className="p-4">
            <div className="d-flex align-items-center space-x-3 mb-4 border-bottom pb-3 border-gray-200">
              <span className={classNames("fs-1", primaryBlueText)} role="img" aria-label="Rabbit Avatar">🐇</span>
              <Title level={1} className="text-gray-800 flex-grow-1">面接開始前の接続確認と同意</Title>
            </div>

            <Row className="g-4">
              {/* Left Side: Connection Check (Camera/Mic) */}
              <Col md={6}>
                <Title level={2} className="mb-4 d-flex align-items-center fs-5">
                  <Video size={24} className={classNames("me-2", primaryBlueText)} />
                  接続デバイスの確認
                </Title>

                {/* Candidate Video Area */}
                {/* hasErrorとonRetryはuseMediaStreamのerrorとgetMediaStreamにマップ */}
                <CameraPreview stream={stream} hasError={cameraError} onRetry={getMediaStream} className="mb-4" />

                {/* Mic Level Display */}
                <MicrophoneLevelIndicator stream={stream} micError={micError} className="mb-4" />

                {/* Test Connection Button */}
                <Button variant="primary" className="w-100" onClick={getMediaStream}> {/* getMediaStreamを再試行ハンドラとして利用 */}
                  <RefreshCcw size={20} className="me-2" />
                  <span>接続をテスト / デバイスを変更</span>
                </Button>
              </Col>

              {/* Right Side: Consent for Recording */}
              <Col md={6}>
                <Title level={2} className="mb-4 d-flex align-items-center fs-5">
                  <FileText size={24} className={classNames("me-2", primaryBlueText)} />
                  録画・録音の同意
                </Title>

                {/* Important Notice */}
                <div className="bg-blue-100 border-start border-4 border-primary-blue text-gray-700 p-3 rounded-3 mb-4">
                  <h3 className="fw-bold mb-2 fs-6">【重要】面接に関するお知らせ</h3>
                  <ul className="list-unstyled space-y-2 text-sm ps-3">
                    <li><small>本面接は、選考およびサービス向上の目的で、**映像と音声を全て録画・録音** いたします。</small></li>
                    <li><small>録画データは、面接終了後、自動的にサーバーにアップロードされ、AIによる採点・分析に使用されます。</small></li>
                    <li><small>録画データは、**採用担当者のみ** が閲覧できる安全な環境で保管されます。</small></li>
                    <li><small>**面接中の途中退室はできません**。必ず最後までご回答ください。</small></li>
                  </ul>
                </div>

                {/* Consent Checkbox */}
                <BootstrapForm.Group className="mb-4">
                  <Checkbox
                    id="consentCheckbox"
                    label={<span className="fs-6 fw-bold text-gray-700 cursor-pointer">上記、録画・録音に関するすべての事項に同意します。</span>}
                    checked={consentChecked}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConsentChecked(e.target.checked)}
                  />
                </BootstrapForm.Group>

                {/* Start Interview Button */}
                <Button
                  id="startButton"
                  variant="primary"
                  className="w-100"
                  onClick={onStartInterview}
                  disabled={!isReadyToStart}
                >
                  <PlayCircle size={24} className="me-2" />
                  <span>{isStarting ? '面接を開始しています...' : '面接を開始する'}</span>
                </Button>
                {isReadyToStart && (
                  <p id="readyMessage" className="text-center text-sm text-success mt-2">
                    準備完了です！ボタンを押して面接を開始してください。
                  </p>
                )}
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};
