import { Card } from '@/molecules';
import { LoginForm } from '@/organisms';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api, ApiError, type AdminLoginResponse } from '../../lib/api';

/**
 * 管理者ログインページ
 */
export const AdminLoginPage = () => {
  const navigate = useNavigate();

  const handleLoginSubmit = async (email: string, password: string): Promise<boolean> => {
    try {
      const { mfa } = await api.post<AdminLoginResponse>('/api/auth/admin/login', {
        email,
        password,
      });
      if (mfa === 'setup_required') {
        toast.info('初回ログインのため、二段階認証の設定に進みます。');
      }
      navigate('/admin/mfa');
      return true;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 400)) {
        return false;
      }
      if (err instanceof ApiError) {
        toast.error(err.message);
        return true;
      }
      throw err;
    }
  };

  return (
    <Container fluid className="page-centered">
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <div className="brand-lockup justify-content-center mb-4">
          <span className="brand-mark" role="img" aria-label="AI一次面接">🐇</span>
          <span>
            <span className="brand-name">AI一次面接</span>
            <span className="brand-sub">RECRUITER CONSOLE</span>
          </span>
        </div>
        <Card className="p-4">
          <LoginForm
            onSubmit={handleLoginSubmit}
            title="管理者ログイン"
            subtitle="採用担当者向けの管理画面です"
            errorMessage="メールアドレスまたはパスワードが正しくありません。"
            loadingText="認証中..."
          />
        </Card>
      </div>
    </Container>
  );
};
