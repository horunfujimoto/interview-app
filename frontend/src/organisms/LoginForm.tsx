import { Button, Message, Title } from '@/atoms';
import { FormField, InputGroup } from '@/molecules';
import { Lock, Mail } from 'lucide-react';
import React, { useState } from 'react';
import { Form, Stack } from 'react-bootstrap';

interface LoginFormProps {
  onSubmit: (loginId: string, password: string) => Promise<boolean>;
  title?: string;
  subtitle?: string;
  errorMessage?: string;
  loadingText?: string;
  loginButtonText?: string; // New prop
}

/**
 * Common Login Form Organism
 * @param {LoginFormProps} props - The props for the component.
 */
export const LoginForm = ({
  onSubmit,
  title = 'ログイン',
  subtitle = 'IDとパスワードを入力してください',
  errorMessage: propErrorMessage,
  loadingText = '認証中...',
  loginButtonText = 'ログイン', // Default value for new prop
}: LoginFormProps) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const success = await onSubmit(loginId, password);
      if (!success) {
        setError(propErrorMessage || 'ログインIDまたはパスワードが正しくありません。');
      }
    } catch (err) {
      setError('認証中にエラーが発生しました。');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="text-center mb-4">
        <Title level={1} className="mb-1">{title}</Title>
        <p className="text-muted">{subtitle}</p>
      </div>

      {error && <Message variant="danger" className="mb-3">{error}</Message>}

      <Stack gap={3} className="mb-4">
        <FormField
          controlId="loginId"
          label="メールアドレス または ログインID"
          as={InputGroup}
          icon={Mail}
          inputProps={{
            type: 'text',
            placeholder: 'admin@example.com または candidate-0001',
            value: loginId,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setLoginId(e.target.value),
            required: true,
          }}
        />
        <FormField
          controlId="password"
          label="パスワード"
          as={InputGroup}
          icon={Lock}
          inputProps={{
            type: 'password',
            placeholder: '••••••••',
            value: password,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
            required: true,
          }}
        />
      </Stack>

      <Button
        variant="primary"
        type="submit"
        className="w-100"
        loading={loading}
        loadingText={loadingText}
        icon={Mail} // Using mail icon as a default login icon
      >
        {loginButtonText} {/* Use loginButtonText here */}
      </Button>
    </Form>
  );
};
