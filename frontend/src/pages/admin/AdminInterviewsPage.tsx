import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/atoms';
import { Table } from '@/molecules';
import { Title } from '@/atoms';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { api, ApiError, type AdminInterviewRow } from '../../lib/api';

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  SCHEDULED: { label: '未実施', variant: 'secondary' },
  IN_PROGRESS: { label: '実施中', variant: 'warning' },
  COMPLETED: { label: '完了', variant: 'success' },
  EXPIRED: { label: '期限切れ', variant: 'danger' },
  CANCELLED: { label: '中止', variant: 'dark' },
};

const MODE_LABELS: Record<string, string> = {
  FIXED: '固定質問',
  AI: 'AI面接',
  HYBRID: 'ハイブリッド',
};

/**
 * 面接一覧ページ（管理者）
 */
export const AdminInterviewsPage = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<AdminInterviewRow[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ interviews: AdminInterviewRow[] }>('/api/admin/interviews');
        setInterviews(data.interviews);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/admin/login');
          return;
        }
        toast.error(err instanceof ApiError ? err.message : '面接一覧の取得に失敗しました。');
      }
    })();
  }, [navigate]);

  if (interviews === null) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <Title level={1}>面接一覧</Title>
        <p className="page-sub">発行済みの面接と実施状況の一覧です</p>
      </div>
      {interviews.length === 0 ? (
        <p className="text-muted">
          面接がまだ発行されていません。<Link to="/admin/interviews/new">面接を発行</Link>してください。
        </p>
      ) : (
        <div className="table-card">
        <Table hover responsive>
          <thead>
            <tr>
              <th>応募者</th>
              <th>ログインID</th>
              <th>モード</th>
              <th>状態</th>
              <th>回答数</th>
              <th>録画</th>
              <th>有効期限</th>
              <th>実施日時</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((iv) => {
              const status = STATUS_LABELS[iv.status] ?? { label: iv.status, variant: 'secondary' };
              return (
                <tr key={iv.id}>
                  <td>{iv.candidateName}</td>
                  <td><code>{iv.loginId}</code></td>
                  <td>{MODE_LABELS[iv.mode] ?? iv.mode}</td>
                  <td><Badge bg={status.variant}>{status.label}</Badge></td>
                  <td>{iv.answerCount}</td>
                  <td>{iv.hasRecording ? '✅' : '—'}</td>
                  <td>{new Date(iv.expiresAt).toLocaleDateString('ja-JP')}</td>
                  <td>{iv.finishedAt ? new Date(iv.finishedAt).toLocaleString('ja-JP') : '—'}</td>
                  <td><Link to={`/admin/interviews/${iv.id}`}>詳細</Link></td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        </div>
      )}
    </div>
  );
};
