import { Title, Logo } from '@/atoms';
import { Card } from '@/molecules';
import { LoginForm } from '@/organisms';
import { Container, Row, Col } from 'react-bootstrap';
import { Video, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api, ApiError, type LoginResponse } from '../lib/api';

/**
 * Applicant Login Page Organism
 */
export const ApplicantLoginPage = () => {
  const navigate = useNavigate();

  const handleLoginSubmit = async (loginId: string, password: string): Promise<boolean> => {
    try {
      const { interview } = await api.post<LoginResponse>('/api/auth/candidate/login', {
        loginId,
        password,
      });
      toast.success(`${interview.candidateName} さん、ようこそ`);
      navigate('/applicant/confirmation');
      return true;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        return false; // LoginForm 側で「ID またはパスワードが正しくありません」を表示
      }
      if (err instanceof ApiError) {
        toast.error(err.message); // 期限切れ・レート制限などは個別メッセージを表示
        return true; // LoginForm の固定エラー文を重ねて出さない
      }
      throw err; // ネットワークエラー等は LoginForm の汎用エラーに任せる
    }
  };

  return (
    <Container fluid className="page-centered">
      <Card className="overflow-hidden" style={{ maxWidth: '880px', width: '100%' }}>
        <Row className="g-0">
          {/* Left Side: Brand and Promo Area (hidden on md and down) */}
          <Col md={6} className="login-hero p-5 d-none d-md-flex flex-column justify-content-center text-start">
            <Logo tone="inverse" sub="AI一次面接" className="mb-4" />
            <Title level={2} className="fw-bold" style={{ lineHeight: 1.4 }}>
              あなたの言葉で、<br />あなたのペースで。
            </Title>
            <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
              準備ができたら、IDとパスワードを入力して面接を開始してください。
            </p>
            <div className="mt-4 d-flex flex-column gap-2 align-items-start">
              <div className="hero-note">
                <Video size={16} />
                <span>面接は録画・録音されます</span>
              </div>
              <div className="hero-note">
                <ShieldCheck size={16} />
                <span>通信は保護されています</span>
              </div>
            </div>
          </Col>

          {/* Right Side: Login Form */}
          <Col md={6} className="p-4 d-flex flex-column justify-content-center">
            <div className="d-md-none d-flex justify-content-center mb-4">
              <Logo sub="AI一次面接" />
            </div>
            <Title level={1} className="text-center mb-1">応募者ログイン</Title>
            <p className="text-sm text-muted text-center mb-4">運営から発行されたIDとパスワードをご利用ください</p>

            <LoginForm
              onSubmit={handleLoginSubmit}
              title="" // Title/Subtitle are handled by the page for applicant
              subtitle=""
              errorMessage="ログインIDまたはパスワードが正しくありません。"
              loadingText="認証中..."
              idLabel="ログインID"
              idPlaceholder="例: cand-1a2b3c4d"
            />

            <p className="text-xs text-muted text-center mt-3">
              ※本アプリはPCブラウザ（Chrome/Edge推奨）専用です。
            </p>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};
