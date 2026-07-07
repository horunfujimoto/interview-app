import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Alert } from 'react-bootstrap';
import { Title, Button } from '@/atoms';
import { toast } from 'react-toastify';
import { Copy } from 'lucide-react';
import {
  api,
  ApiError,
  type QuestionSetSummary,
  type CreateInterviewResponse,
  type IssuedCredentials,
} from '../../lib/api';

/**
 * 面接発行ページ（管理者）
 * 発行するとワンタイムの loginId / パスワードが一度だけ表示される。
 */
export const AdminInterviewNewPage = () => {
  const navigate = useNavigate();
  const [questionSets, setQuestionSets] = useState<QuestionSetSummary[]>([]);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [mode, setMode] = useState<'FIXED' | 'AI' | 'HYBRID'>('FIXED');
  const [questionSetId, setQuestionSetId] = useState<number | ''>('');
  const [validDays, setValidDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ questionSets: QuestionSetSummary[] }>('/api/admin/question-sets');
        setQuestionSets(data.questionSets);
        if (data.questionSets.length > 0) {
          setQuestionSetId(data.questionSets[0].id);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/admin/login');
        }
      }
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = await api.post<CreateInterviewResponse>('/api/admin/interviews', {
        candidateName,
        candidateEmail: candidateEmail || null,
        mode,
        questionSetId: mode === 'AI' ? null : questionSetId || null,
        validDays,
      });
      setIssued(data.credentials);
      toast.success('面接を発行しました。');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/admin/login');
        return;
      }
      toast.error(err instanceof ApiError ? err.message : '面接の発行に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!issued) return;
    navigator.clipboard.writeText(`ログインID: ${issued.loginId}\nパスワード: ${issued.password}`);
    toast.info('認証情報をコピーしました。');
  };

  if (issued) {
    return (
      <div style={{ maxWidth: '600px' }}>
        <div className="page-header">
          <Title level={1}>面接を発行しました</Title>
          <p className="page-sub">応募者に認証情報を共有してください</p>
        </div>
        <Alert variant="warning">
          <strong>この認証情報は今回しか表示されません。</strong>
          必ずコピーして応募者に安全な方法で共有してください（DBにはハッシュのみ保存されます）。
        </Alert>
        <div className="credential-box mb-3">
          <dl className="mb-0">
            <dt>ログインID</dt>
            <dd><code>{issued.loginId}</code></dd>
            <dt className="mt-3">パスワード</dt>
            <dd><code>{issued.password}</code></dd>
          </dl>
        </div>
        <div className="d-flex gap-2">
          <Button variant="primary" onClick={copyCredentials}>
            <Copy size={18} className="me-2" />
            コピー
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate('/admin/interviews')}>
            面接一覧へ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="page-header">
        <Title level={1}>面接を発行</Title>
        <p className="page-sub">応募者ごとにワンタイムの認証情報を発行します</p>
      </div>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="candidateName">
          <Form.Label>応募者名 <span className="text-danger">*</span></Form.Label>
          <Form.Control
            type="text"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            required
            maxLength={100}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="candidateEmail">
          <Form.Label>メールアドレス（任意）</Form.Label>
          <Form.Control
            type="email"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            maxLength={200}
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="mode">
          <Form.Label>面接モード</Form.Label>
          <Form.Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="FIXED">固定質問（用意した質問のみ）</option>
            <option value="AI" disabled>AI面接（準備中）</option>
            <option value="HYBRID" disabled>ハイブリッド（準備中）</option>
          </Form.Select>
        </Form.Group>

        {mode !== 'AI' && (
          <Form.Group className="mb-3" controlId="questionSetId">
            <Form.Label>質問セット <span className="text-danger">*</span></Form.Label>
            <Form.Select
              value={questionSetId}
              onChange={(e) => setQuestionSetId(Number(e.target.value))}
              required
            >
              {questionSets.length === 0 && <option value="">質問セットがありません</option>}
              {questionSets.map((qs) => (
                <option key={qs.id} value={qs.id}>
                  {qs.name}（{qs.questionCount}問）
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        )}

        <Form.Group className="mb-4" controlId="validDays">
          <Form.Label>有効期限（日数）</Form.Label>
          <Form.Control
            type="number"
            min={1}
            max={60}
            value={validDays}
            onChange={(e) => setValidDays(Number(e.target.value))}
          />
        </Form.Group>

        <Button type="submit" variant="primary" loading={submitting} loadingText="発行中...">
          発行する
        </Button>
      </Form>
    </div>
  );
};
