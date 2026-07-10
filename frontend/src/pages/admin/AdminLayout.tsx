import { useEffect, useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { Users, FilePlus, ListChecks, ScrollText, LogOut } from 'lucide-react';
import { Nav } from 'react-bootstrap';
import { Logo } from '@/atoms';
import { api, type AdminMeResponse, type AdminUser } from '../../lib/api';
import { toast } from 'react-toastify';

/**
 * 管理者画面の共通レイアウト（サイドバー + コンテンツ）
 */
export const AdminLayout = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  // ロール別のメニュー出し分け用（取得失敗時は共通メニューのみ表示。
  // 401 は各ページ側の useAdminApiError がログインへ誘導する）
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<AdminMeResponse>('/api/admin/me');
        setAdmin(data.admin);
      } catch {
        /* 出し分けを諦めるだけで画面遷移は妨げない */
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      toast.info('ログアウトしました。');
      navigate('/admin/login');
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? 'active' : ''}`;

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="px-2">
          <Logo sub="RECRUITER CONSOLE" />
        </div>

        <div>
          <div className="sidebar-section-label">採用管理</div>
          <Nav className="flex-column">
            <NavLink to="/admin/interviews" end className={linkClass}>
              <Users size={17} />
              面接一覧
            </NavLink>
            <NavLink to="/admin/interviews/new" className={linkClass}>
              <FilePlus size={17} />
              面接を発行
            </NavLink>
            <NavLink to="/admin/question-sets" className={linkClass}>
              <ListChecks size={17} />
              質問セット
            </NavLink>
            {admin?.role === 'OWNER' && (
              <NavLink to="/admin/audit-logs" className={linkClass}>
                <ScrollText size={17} />
                監査ログ
              </NavLink>
            )}
          </Nav>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-link">
            <LogOut size={17} />
            ログアウト
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};
