import { Title, Button, Logo } from '@/atoms';
import { Card } from '@/molecules';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';

/**
 * Interview Finish Page
 */
export const FinishPage = () => {
  const navigate = useNavigate();

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <Container fluid className="page-centered">
      <Card className="overflow-hidden text-center" style={{ maxWidth: '560px', width: '100%' }}>
        <Row className="g-0">
          <Col className="p-5 d-flex flex-column justify-content-center align-items-center">
            <div className="d-flex justify-content-center mb-4">
              <Logo sub="AI一次面接" />
            </div>
            <CircleCheck size={64} strokeWidth={1.5} style={{ color: 'var(--ok-ink)' }} />
            <Title level={2} className="mt-4 fw-bold">面接は以上で終了です。</Title>
            <p className="mt-3 text-muted">
              お疲れ様でした。
              <br />
              本日の面接は全て完了となります。結果については、後日改めて担当者よりご連絡いたします。
            </p>
            <Button
              variant="primary"
              onClick={handleGoToHome}
              className="mt-4"
            >
              ログインページに戻る
            </Button>
          </Col>
        </Row>
      </Card>
    </Container>
  );
};
