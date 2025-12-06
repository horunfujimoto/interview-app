import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, Container, Row, Col, Form as BootstrapForm } from 'react-bootstrap';
import { Video, FileText, RefreshCcw, PlayCircle } from 'lucide-react';
import { Title, Button, Checkbox } from '@/atoms';
import { CameraPreview, MicrophoneLevelIndicator } from '@/molecules';
import classNames from 'classnames';

interface ConnectionConfirmationPageProps {
  onStartInterview: () => void; // Callback when interview starts
}

export const ConnectionConfirmationPage = ({ onStartInterview }: ConnectionConfirmationPageProps) => {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [micError, setMicError] = useState(false); // New state for mic specific errors
  const [consentChecked, setConsentChecked] = useState(false);
  const isMounted = useRef(true); // To prevent state updates on unmounted component

  const initializeMedia = useCallback(async () => {
    if (!isMounted.current) return;

    setCameraError(false);
    setMicError(false); // Reset mic error
    // mediaStream stop is handled in useEffect cleanup
    setMediaStream(null); // Clear previous stream

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (isMounted.current) {
        setMediaStream(stream);
      }
    } catch (err) {
      console.error('メディアアクセスエラー:', err);
      if (isMounted.current) {
        setCameraError(true);
        // Determine if it's a specific mic error or general error
        // For now, if there's any media access error, assume mic is also affected
        setMicError(true);
      }
    }
  }, []); // Empty dependency array, as this function doesn't depend on external mutable state

  useEffect(() => {
    isMounted.current = true;
    initializeMedia();

    return () => {
      isMounted.current = false;
      // Stop all tracks when component unmounts
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [initializeMedia]); // Re-run if initializeMedia changes

  const isReadyToStart = mediaStream !== null && !cameraError && !micError && consentChecked;

  // Placeholder for primary-blue-text class
  const primaryBlueText = "text-primary-blue-text"; // Assuming this is defined in global CSS or will be replaced

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ backgroundColor: '#f3f4f6' }}>
      <Card className="shadow-lg overflow-hidden" style={{ maxWidth: '900px' }}>
        <Row className="g-0">
          <Col md={12} className="p-4">
            <div className="d-flex align-items-center space-x-3 mb-4 border-bottom pb-3 border-gray-200">
              <span className={classNames("fs-1", primaryBlueText)} role="img" aria-label="Rabbit Avatar">🐇</span> {/* Tailwind font-size-50px to fs-1 */}
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
                <CameraPreview stream={mediaStream} hasError={cameraError} onRetry={initializeMedia} className="mb-4" />

                {/* Mic Level Display */}
                <MicrophoneLevelIndicator stream={mediaStream} micError={micError} className="mb-4" />

                {/* Test Connection Button */}
                <Button variant="primary" className="w-100" onClick={initializeMedia}>
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
                  <ul className="list-unstyled space-y-2 text-sm ps-3"> {/* list-disc list-inside space-y-2 */}
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
                  <span>面接を開始する</span>
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
