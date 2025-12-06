import { Title } from '@/atoms';
import { Card } from '@/molecules';
import { LoginForm } from '@/organisms';
import { Container, Row, Col } from 'react-bootstrap';
import { Video, ShieldCheck } from 'lucide-react'; // Only Video and ShieldCheck are used directly

interface ApplicantLoginPageProps {
  // Props specific to the applicant login page, if any
}

/**
 * Applicant Login Page Organism
 * @param {ApplicantLoginPageProps} props - The props for the component.
 */
export const ApplicantLoginPage = ({}: ApplicantLoginPageProps) => {
  const handleLoginSubmit = async (loginId: string, password: string): Promise<boolean> => {
    console.log('Applicant login attempt:', { loginId, password });
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    if (loginId === 'candidate-0001' && password === 'P@ssword123') {
      alert('応募者ログイン成功 (モック)！');
      return true;
    } else {
      alert('応募者ログイン失敗 (モック)！');
      return false;
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ backgroundColor: '#f3f4f6' }}>
      <Card className="shadow-lg overflow-hidden" style={{ maxWidth: '900px' }}> {/* Max width for the whole card */}
        <Row className="g-0"> {/* g-0 to remove gutter */}
          {/* Left Side: Avatar and Promo Area (hidden on md and down) */}
          <Col md={6} className="p-4 d-none d-md-flex flex-column justify-content-center align-items-center text-center" style={{ background: 'linear-gradient(135deg, #bfdbfe 0%, #60a5fa 100%)' }}>
            <span style={{ fontSize: '80px', filter: 'drop-shadow(3px 3px 5px rgba(0,0,0,0.2))' }}>🐇</span>
            <Title level={2} className="mt-4 text-white fw-bold">AI面接官がお待ちしています</Title>
            <p className="mt-2 text-sm text-gray-100">IDとパスワードを入力して、面接を開始してください。</p>
            <div className="mt-4 w-100 px-4">
              <div className="d-flex align-items-center text-white text-sm mb-2">
                <Video size={16} className="me-2" />
                <span>面接は録画・録音されます</span>
              </div>
              <div className="d-flex align-items-center text-white text-sm">
                <ShieldCheck size={16} className="me-2" />
                <span>セキュリティ対策済み</span>
              </div>
            </div>
          </Col>

          {/* Right Side: Login Form */}
          <Col md={6} className="p-4 d-flex flex-column justify-content-center">
            <div className="d-md-none text-center mb-4">
              <span style={{ fontSize: '50px' }}>🐇</span>
            </div>
            <Title level={1} className="text-center mb-1">応募者ログイン</Title>
            <p className="text-sm text-muted text-center mb-4">運営から発行されたIDとパスワードをご利用ください</p>

            <LoginForm
              onSubmit={handleLoginSubmit}
              title="" // Title/Subtitle are handled by the page for applicant
              subtitle=""
              errorMessage="ログインIDまたはパスワードが正しくありません。"
              loadingText="認証中..."
            />

            <p className="text-xs text-muted text-center mt-3">
              本アプリはPCブラウザ（Chrome/Edge推奨）専用です。
            </p>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};
