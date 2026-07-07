import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Spinner } from 'react-bootstrap';
import { Title, Button } from '@/atoms';
import { Card, Table } from '@/molecules';
import { Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { api, ApiError, type QuestionSetSummary } from '../../lib/api';

/**
 * 質問セット管理ページ（管理者）
 * 一覧表示と新規作成（1行=1質問のテキストエリア入力）。
 */
export const AdminQuestionSetsPage = () => {
  const navigate = useNavigate();
  const [sets, setSets] = useState<QuestionSetSummary[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [questionsText, setQuestionsText] = useState('');
  const [timeLimitSec, setTimeLimitSec] = useState(180);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ questionSets: QuestionSetSummary[] }>('/api/admin/question-sets');
      setSets(data.questionSets);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/admin/login');
        return;
      }
      toast.error(err instanceof ApiError ? err.message : '質問セットの取得に失敗しました。');
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const questions = questionsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((text) => ({ text, timeLimitSec }));

    if (questions.length === 0) {
      toast.error('質問を1問以上入力してください。');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/admin/question-sets', {
        name,
        description: description || null,
        questions,
      });
      toast.success('質問セットを作成しました。');
      setShowForm(false);
      setName('');
      setDescription('');
      setQuestionsText('');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '作成に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: number, setName: string) => {
    if (!window.confirm(`「${setName}」をアーカイブしますか？（面接発行時に選択できなくなります）`)) return;
    try {
      await api.post(`/api/admin/question-sets/${id}/archive`);
      toast.success('アーカイブしました。');
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'アーカイブに失敗しました。');
    }
  };

  if (sets === null) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-0">
        <div className="page-header">
          <Title level={1}>質問セット</Title>
          <p className="page-sub">面接発行時に選べる質問のひな型を管理します</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="me-2" />
          新規作成
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-4">
          <Form onSubmit={handleCreate}>
            <Form.Group className="mb-3" controlId="setName">
              <Form.Label>セット名 <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: エンジニア一次面接 v1"
                required
                maxLength={200}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="setDescription">
              <Form.Label>説明（任意）</Form.Label>
              <Form.Control
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="setQuestions">
              <Form.Label>質問（1行につき1問） <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={questionsText}
                onChange={(e) => setQuestionsText(e.target.value)}
                placeholder={'自己紹介をお願いします。\n当社を志望した理由を教えてください。'}
                required
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="setTimeLimit">
              <Form.Label>1問あたりの回答制限時間（秒）</Form.Label>
              <Form.Control
                type="number"
                min={30}
                max={1800}
                value={timeLimitSec}
                onChange={(e) => setTimeLimitSec(Number(e.target.value))}
                style={{ maxWidth: '200px' }}
              />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" loading={submitting} loadingText="作成中...">
                作成する
              </Button>
              <Button variant="outline-secondary" onClick={() => setShowForm(false)}>
                キャンセル
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {sets.length === 0 ? (
        <p className="text-muted">質問セットがまだありません。「新規作成」から作成してください。</p>
      ) : (
        <div className="table-card">
        <Table hover responsive>
          <thead>
            <tr>
              <th>セット名</th>
              <th>説明</th>
              <th>質問数</th>
              <th>利用面接数</th>
              <th>作成日</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sets.map((qs) => (
              <tr key={qs.id}>
                <td>{qs.name}</td>
                <td className="text-muted">{qs.description ?? '—'}</td>
                <td>{qs.questionCount}</td>
                <td>{qs.interviewCount}</td>
                <td>{new Date(qs.createdAt).toLocaleDateString('ja-JP')}</td>
                <td>
                  <Button variant="outline-danger" size="sm" onClick={() => handleArchive(qs.id, qs.name)}>
                    アーカイブ
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        </div>
      )}
    </div>
  );
};
