import { Title, Button } from '@/atoms';
import { Card } from '@/molecules';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PartyPopper } from 'lucide-react';

/**
 * Interview Finish Page
 */
export const FinishPage = () => {
  const navigate = useNavigate();

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{ backgroundColor: '#f3f4f6' }}>
      <Card className="shadow-lg overflow-hidden text-center" style={{ maxWidth: '600px' }}>
        <Row className="g-0">
          <Col className="p-5 d-flex flex-column justify-content-center align-items-center">
            <span style={{ fontSize: '80px', filter: 'drop-shadow(3px 3px 5px rgba(0,0,0,0.2))' }}>
              <PartyPopper size={80} strokeWidth={1.5} />
            </span>
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
