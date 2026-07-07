import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Spinner, Alert } from 'react-bootstrap';
import { Title, Button } from '@/atoms';
import { Card } from '@/molecules';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { api, ApiError, type AdminMfaVerifyResponse } from '../../lib/api';

type Stage = 'setup' | 'verify';

/**
 * 管理者の二段階認証ページ。
 * setup: 初回ログイン時。QRコードを認証アプリで読み取り、コードを入力して有効化（強制）。
 * verify: 2回目以降。認証アプリの6桁コードを入力。
 */
export const AdminMfaPage = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MFA待ちセッションの確認とステージ取得
  useEffect(() => {
    (async () => {
      try {
        const session = await api.get<{ stage: Stage }>('/api/auth/admin/mfa/session');
        setStage(session.stage);
        if (session.stage === 'setup') {
          const setup = await api.get<{ qrDataUrl: string; secret: string }>('/api/auth/admin/mfa/setup');
          setQrDataUrl(setup.qrDataUrl);
          setSecret(setup.secret);
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          toast.error('ログインからやり直してください。');
          navigate('/admin/login');
          return;
        }
        toast.error(err instanceof ApiError ? err.message : '二段階認証の準備に失敗しました。');
      }
    })();
  }, [navigate]);

  const handleVerify = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { admin } = await api.post<AdminMfaVerifyResponse>('/api/auth/admin/mfa/verify', { code });
      toast.success(`${admin.name} さん、ようこそ`);
      navigate('/admin/interviews');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('認証コードが正しくありません。認証アプリの最新のコードを入力してください。');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('認証中にエラーが発生しました。');
      }
      setCode('');
    } finally {
      setSubmitting(false);
    }
  }, [code, navigate]);

  if (stage === null) {
    return (
      <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ backgroundColor: '#f3f4f6' }}>
      <Card className="shadow-lg p-4" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="text-center mb-4">
          <ShieldCheck size={40} className="text-primary mb-2" />
          <Title level={1} className="fs-3">二段階認証</Title>
        </div>

        {stage === 'setup' && (
          <>
            <Alert variant="info" className="text-sm">
              <strong>初回ログインのため、二段階認証の設定が必要です。</strong><br />
              Google Authenticator や Microsoft Authenticator などの認証アプリで下の QR コードを読み取ってください。
            </Alert>
            <div className="text-center mb-3">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="TOTP QRコード" style={{ width: '200px', height: '200px' }} />
              ) : (
                <Spinner animation="border" />
              )}
            </div>
            {secret && (
              <p className="text-center text-muted text-sm mb-4">
                QRを読み取れない場合は、このキーを手動で入力してください:<br />
                <code className="user-select-all">{secret}</code>
              </p>
            )}
          </>
        )}

        {stage === 'verify' && (
          <p className="text-center text-muted mb-4">
            認証アプリに表示されている6桁のコードを入力してください。
          </p>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleVerify}>
          <Form.Group className="mb-4" controlId="totpCode">
            <Form.Label>認証コード（6桁）</Form.Label>
            <Form.Control
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="text-center fs-3"
              style={{ letterSpacing: '0.5em' }}
              required
              autoFocus
            />
          </Form.Group>
          <Button
            type="submit"
            variant="primary"
            className="w-100"
            loading={submitting}
            loadingText="確認中..."
            disabled={code.length !== 6}
          >
            {stage === 'setup' ? '設定を完了してログイン' : '認証する'}
          </Button>
        </Form>
      </Card>
    </Container>
  );
};
