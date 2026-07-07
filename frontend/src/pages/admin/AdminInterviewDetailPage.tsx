import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Spinner, Alert } from 'react-bootstrap';
import { Title, Badge, Button } from '@/atoms';
import { Card, Table } from '@/molecules';
import { Download, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { api, ApiError, type AdminInterviewDetail } from '../../lib/api';
import { InterviewQuestionEditor } from './InterviewQuestionEditor';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

/**
 * 面接結果の詳細ページ（管理者）
 */
export const AdminInterviewDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<AdminInterviewDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ interview: AdminInterviewDetail }>(`/api/admin/interviews/${id}`);
        setDetail(data.interview);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/admin/login');
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        toast.error(err instanceof ApiError ? err.message : '面接詳細の取得に失敗しました。');
      }
    })();
  }, [id, navigate]);

  if (notFound) {
    return <Alert variant="danger">面接が見つかりません。</Alert>;
  }
  if (!detail) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }

  const formatDuration = (sec: number | null) =>
    sec === null ? '—' : `${Math.floor(sec / 60)}分${sec % 60}秒`;

  return (
    <div>
      <Link to="/admin/interviews" className="d-inline-flex align-items-center mb-3 text-decoration-none">
        <ArrowLeft size={18} className="me-1" />
        面接一覧に戻る
      </Link>
      <Title level={1} className="mb-4">{detail.candidateName} さんの面接結果</Title>

      <Card className="p-4 mb-4">
        <dl className="row mb-0">
          <dt className="col-sm-3">状態</dt>
          <dd className="col-sm-9"><Badge bg={detail.status === 'COMPLETED' ? 'success' : 'secondary'}>{detail.status}</Badge></dd>
          <dt className="col-sm-3">ログインID</dt>
          <dd className="col-sm-9"><code>{detail.loginId}</code></dd>
          <dt className="col-sm-3">質問セット</dt>
          <dd className="col-sm-9">{detail.questionSetName ?? '—'}</dd>
          <dt className="col-sm-3">実施日時</dt>
          <dd className="col-sm-9">
            {detail.startedAt ? new Date(detail.startedAt).toLocaleString('ja-JP') : '未実施'}
            {detail.finishedAt && ` 〜 ${new Date(detail.finishedAt).toLocaleString('ja-JP')}`}
          </dd>
          <dt className="col-sm-3">発行者</dt>
          <dd className="col-sm-9">{detail.createdBy}</dd>
        </dl>
      </Card>

      {/* 面接開始前のみ: この応募者専用の質問カスタマイズ */}
      {detail.canEditQuestions && (
        <InterviewQuestionEditor interviewId={detail.id} initialQuestions={detail.questions} />
      )}

      {detail.recording && (
        <div className="mb-4">
          <a href={`${API_BASE}/api/admin/interviews/${detail.id}/recording`} download>
            <Button variant="outline-primary">
              <Download size={18} className="me-2" />
              録画をダウンロード
              {detail.recording.sizeBytes && ` (${(Number(detail.recording.sizeBytes) / 1024 / 1024).toFixed(1)} MB)`}
            </Button>
          </a>
        </div>
      )}

      <Title level={2} className="mb-3 fs-4">回答一覧（{detail.answers.length}件）</Title>
      {detail.answers.length === 0 ? (
        <p className="text-muted">まだ回答がありません。</p>
      ) : (
        <Table striped responsive>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>#</th>
              <th>質問</th>
              <th style={{ width: '120px' }}>回答時間</th>
              <th>文字起こし</th>
            </tr>
          </thead>
          <tbody>
            {detail.answers.map((a) => (
              <tr key={a.sequence}>
                <td>{a.sequence}</td>
                <td>{a.questionText}</td>
                <td>{formatDuration(a.durationSec)}</td>
                <td className="text-muted">{a.transcript ?? '（未対応: Phase 4 で実装予定）'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};
