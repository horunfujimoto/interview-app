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
      const { admin } = await api.post<AdminLoginResponse>('/api/auth/admin/login', {
        email,
        password,
      });
      toast.success(`${admin.name} さん、ようこそ`);
      navigate('/admin/interviews');
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
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ backgroundColor: '#f3f4f6' }}>
      <Card className="shadow-lg p-4" style={{ maxWidth: '450px', width: '100%' }}>
        <LoginForm
          onSubmit={handleLoginSubmit}
          title="管理者ログイン"
          subtitle="採用担当者向けの管理画面です"
          errorMessage="メールアドレスまたはパスワードが正しくありません。"
          loadingText="認証中..."
        />
      </Card>
    </Container>
  );
};
