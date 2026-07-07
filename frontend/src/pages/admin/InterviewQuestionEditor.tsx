import React, { useEffect, useState, useCallback } from 'react';
import { Form, InputGroup, ListGroup } from 'react-bootstrap';
import { Title, Button } from '@/atoms';
import { Card } from '@/molecules';
import { Plus, Pencil, Trash2, Check, X, Layers } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  api,
  ApiError,
  type AdminInterviewQuestion,
  type QuestionSetSummary,
} from '../../lib/api';

interface InterviewQuestionEditorProps {
  interviewId: string;
  initialQuestions: AdminInterviewQuestion[];
}

/**
 * 面接ごとの質問カスタマイズエディタ（面接開始前のみ表示される）。
 * セットからコピーされた質問に対して、追加・編集・削除・別セットの再適用ができる。
 * 元の質問セット（テンプレート）には影響しない。
 */
export const InterviewQuestionEditor = ({ interviewId, initialQuestions }: InterviewQuestionEditorProps) => {
  const [questions, setQuestions] = useState<AdminInterviewQuestion[]>(initialQuestions);
  const [questionSets, setQuestionSets] = useState<QuestionSetSummary[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | ''>('');

  // 追加フォーム
  const [newText, setNewText] = useState('');
  const [newTimeLimit, setNewTimeLimit] = useState(180);
  const [adding, setAdding] = useState(false);

  // インライン編集
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editTimeLimit, setEditTimeLimit] = useState(180);

  useEffect(() => {
    api
      .get<{ questionSets: QuestionSetSummary[] }>('/api/admin/question-sets')
      .then((d) => setQuestionSets(d.questionSets))
      .catch(() => {/* セット一覧が取れなくても個別編集は可能 */});
  }, []);

  const handleAdd = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setAdding(true);
    try {
      const { question } = await api.post<{ question: AdminInterviewQuestion }>(
        `/api/admin/interviews/${interviewId}/questions`,
        { text: newText.trim(), timeLimitSec: newTimeLimit }
      );
      setQuestions((prev) => [...prev, question]);
      setNewText('');
      toast.success('質問を追加しました。');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '追加に失敗しました。');
    } finally {
      setAdding(false);
    }
  }, [interviewId, newText, newTimeLimit]);

  const startEdit = (q: AdminInterviewQuestion) => {
    setEditingId(q.id);
    setEditText(q.text);
    setEditTimeLimit(q.timeLimitSec);
  };

  const handleEditSave = useCallback(async () => {
    if (editingId === null || !editText.trim()) return;
    try {
      const { question } = await api.put<{ question: AdminInterviewQuestion }>(
        `/api/admin/interviews/${interviewId}/questions/${editingId}`,
        { text: editText.trim(), timeLimitSec: editTimeLimit }
      );
      setQuestions((prev) => prev.map((q) => (q.id === question.id ? question : q)));
      setEditingId(null);
      toast.success('質問を更新しました。');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '更新に失敗しました。');
    }
  }, [interviewId, editingId, editText, editTimeLimit]);

  const handleDelete = useCallback(async (q: AdminInterviewQuestion) => {
    if (!window.confirm(`質問 ${q.sequence}「${q.text.slice(0, 30)}...」を削除しますか？`)) return;
    try {
      await api.delete(`/api/admin/interviews/${interviewId}/questions/${q.id}`);
      // 削除後はサーバー側で連番が振り直されるため再取得する
      const detail = await api.get<{ interview: { questions: AdminInterviewQuestion[] } }>(
        `/api/admin/interviews/${interviewId}`
      );
      setQuestions(detail.interview.questions);
      toast.success('質問を削除しました。');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '削除に失敗しました。');
    }
  }, [interviewId]);

  const handleApplySet = useCallback(async () => {
    if (selectedSetId === '') return;
    const set = questionSets.find((s) => s.id === selectedSetId);
    if (!window.confirm(
      `「${set?.name}」の内容でこの応募者の質問を置き換えますか？\n現在の質問（個別編集分を含む）はすべて上書きされます。`
    )) return;
    try {
      const { questions: applied } = await api.post<{ questions: AdminInterviewQuestion[] }>(
        `/api/admin/interviews/${interviewId}/questions/apply-set`,
        { questionSetId: selectedSetId }
      );
      setQuestions(applied);
      toast.success('質問セットを適用しました。この状態からさらに個別編集できます。');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'セットの適用に失敗しました。');
    }
  }, [interviewId, selectedSetId, questionSets]);

  return (
    <Card className="p-4 mb-4">
      <Title level={2} className="mb-1 fs-4">この応募者の質問（{questions.length}問）</Title>
      <p className="text-muted text-sm mb-3">
        面接開始前のため編集できます。ここでの変更はこの応募者だけに反映され、元の質問セットは変わりません。
      </p>

      {/* セットの再適用 */}
      <InputGroup className="mb-4" style={{ maxWidth: '520px' }}>
        <InputGroup.Text><Layers size={16} /></InputGroup.Text>
        <Form.Select
          value={selectedSetId}
          onChange={(e) => setSelectedSetId(e.target.value === '' ? '' : Number(e.target.value))}
        >
          <option value="">セットの内容で置き換える...</option>
          {questionSets.map((s) => (
            <option key={s.id} value={s.id}>{s.name}（{s.questionCount}問）</option>
          ))}
        </Form.Select>
        <Button variant="outline-primary" onClick={handleApplySet} disabled={selectedSetId === ''}>
          適用
        </Button>
      </InputGroup>

      {/* 質問リスト */}
      <ListGroup className="mb-4">
        {questions.map((q) => (
          <ListGroup.Item key={q.id} className="d-flex align-items-start gap-2">
            {editingId === q.id ? (
              <>
                <span className="fw-bold pt-2" style={{ minWidth: '2rem' }}>{q.sequence}.</span>
                <div className="flex-grow-1">
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="mb-2"
                  />
                  <InputGroup size="sm" style={{ maxWidth: '260px' }}>
                    <InputGroup.Text>制限時間（秒）</InputGroup.Text>
                    <Form.Control
                      type="number"
                      min={30}
                      max={1800}
                      value={editTimeLimit}
                      onChange={(e) => setEditTimeLimit(Number(e.target.value))}
                    />
                  </InputGroup>
                </div>
                <Button variant="success" size="sm" onClick={handleEditSave} title="保存">
                  <Check size={16} />
                </Button>
                <Button variant="outline-secondary" size="sm" onClick={() => setEditingId(null)} title="キャンセル">
                  <X size={16} />
                </Button>
              </>
            ) : (
              <>
                <span className="fw-bold" style={{ minWidth: '2rem' }}>{q.sequence}.</span>
                <div className="flex-grow-1">
                  <div>{q.text}</div>
                  <small className="text-muted">制限時間: {q.timeLimitSec}秒</small>
                </div>
                <Button variant="outline-secondary" size="sm" onClick={() => startEdit(q)} title="編集">
                  <Pencil size={16} />
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(q)} title="削除">
                  <Trash2 size={16} />
                </Button>
              </>
            )}
          </ListGroup.Item>
        ))}
        {questions.length === 0 && (
          <ListGroup.Item className="text-muted">
            質問がありません。下のフォームから追加するか、セットを適用してください。
          </ListGroup.Item>
        )}
      </ListGroup>

      {/* 追加フォーム */}
      <Form onSubmit={handleAdd}>
        <Form.Label className="fw-bold">質問を追加</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="この応募者にだけ聞きたい質問を入力..."
          className="mb-2"
        />
        <div className="d-flex align-items-center gap-2">
          <InputGroup size="sm" style={{ maxWidth: '260px' }}>
            <InputGroup.Text>制限時間（秒）</InputGroup.Text>
            <Form.Control
              type="number"
              min={30}
              max={1800}
              value={newTimeLimit}
              onChange={(e) => setNewTimeLimit(Number(e.target.value))}
            />
          </InputGroup>
          <Button type="submit" variant="primary" size="sm" loading={adding} disabled={!newText.trim()}>
            <Plus size={16} className="me-1" />
            追加
          </Button>
        </div>
      </Form>
    </Card>
  );
};
