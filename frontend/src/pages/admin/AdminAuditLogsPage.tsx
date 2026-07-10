import { useEffect, useState } from 'react';
import { Spinner, Form } from 'react-bootstrap';
import { Badge, Title } from '@/atoms';
import { Table, Pagination } from '@/molecules';
import { api, ApiError, type AdminAuditLog, type AdminAuditLogsResponse } from '../../lib/api';
import { useAdminApiError } from './useAdminApiError';

const ACTOR_LABELS: Record<AdminAuditLog['actorType'], { label: string; variant: string }> = {
  admin: { label: '管理者', variant: 'primary' },
  candidate: { label: '応募者', variant: 'info' },
  system: { label: 'システム', variant: 'secondary' },
};

type ActorFilter = '' | AdminAuditLog['actorType'];

/**
 * 監査ログ閲覧ページ（OWNER のみ。RECRUITER には 403 が返る）
 */
export const AdminAuditLogsPage = () => {
  const handleApiError = useAdminApiError();
  const [data, setData] = useState<AdminAuditLogsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [actorType, setActorType] = useState<ActorFilter>('');
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (actorType) params.set('actorType', actorType);
        const res = await api.get<AdminAuditLogsResponse>(`/api/admin/audit-logs?${params}`);
        setData(res);
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true);
          return;
        }
        handleApiError(err, '監査ログの取得に失敗しました。');
      }
    })();
  }, [page, actorType, handleApiError]);

  if (forbidden) {
    return (
      <div>
        <div className="page-header">
          <Title level={1}>監査ログ</Title>
        </div>
        <p className="text-muted">監査ログの閲覧には OWNER 権限が必要です。</p>
      </div>
    );
  }

  if (data === null) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div>
      <div className="page-header">
        <Title level={1}>監査ログ</Title>
        <p className="page-sub">ログイン・面接操作・録画操作などの記録です（全 {data.total} 件）</p>
      </div>

      <Form.Select
        className="mb-3"
        style={{ maxWidth: '240px' }}
        value={actorType}
        onChange={(e) => {
          setActorType(e.target.value as ActorFilter);
          setPage(1);
        }}
        aria-label="操作主体で絞り込み"
      >
        <option value="">すべての操作主体</option>
        <option value="admin">管理者</option>
        <option value="candidate">応募者</option>
        <option value="system">システム</option>
      </Form.Select>

      {data.logs.length === 0 ? (
        <p className="text-muted">記録がありません。</p>
      ) : (
        <div className="table-card">
          <Table hover responsive>
            <thead>
              <tr>
                <th>日時</th>
                <th>操作主体</th>
                <th>ID</th>
                <th>アクション</th>
                <th>詳細</th>
                <th>IPアドレス</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log) => {
                const actor = ACTOR_LABELS[log.actorType] ?? { label: log.actorType, variant: 'secondary' };
                return (
                  <tr key={log.id}>
                    <td className="text-nowrap">{new Date(log.createdAt).toLocaleString('ja-JP')}</td>
                    <td><Badge bg={actor.variant}>{actor.label}</Badge></td>
                    <td><code>{log.actorId}</code></td>
                    <td><code>{log.action}</code></td>
                    <td>{log.detail ?? '—'}</td>
                    <td>{log.ipAddress ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-3 justify-content-center">
          <Pagination.Prev disabled={page <= 1} onClick={() => setPage(page - 1)} />
          <Pagination.Item active>{`${page} / ${totalPages}`}</Pagination.Item>
          <Pagination.Next disabled={page >= totalPages} onClick={() => setPage(page + 1)} />
        </Pagination>
      )}
    </div>
  );
};
