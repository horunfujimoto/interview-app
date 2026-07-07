import { Outlet, useNavigate } from 'react-router-dom';
import { Users, FilePlus, ListChecks, LogOut } from 'lucide-react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { api } from '../../lib/api';
import { toast } from 'react-toastify';

/**
 * 管理者画面の共通レイアウト（サイドバー + コンテンツ）
 */
export const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      toast.info('ログアウトしました。');
      navigate('/admin/login');
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link d-flex align-items-center py-2 ${isActive ? 'fw-bold text-primary' : 'text-body'}`;

  return (
    <div className="d-flex min-vh-100">
      <div style={{ width: '250px', backgroundColor: '#f8f9fa', padding: '1rem', borderRight: '1px solid #dee2e6', flexShrink: 0 }}>
        <h5 className="mb-3">🐇 面接管理</h5>
        <Nav className="flex-column">
          <NavLink to="/admin/interviews" end className={linkClass}>
            <Users size={18} className="me-2" />
            面接一覧
          </NavLink>
          <NavLink to="/admin/interviews/new" className={linkClass}>
            <FilePlus size={18} className="me-2" />
            面接を発行
          </NavLink>
          <NavLink to="/admin/question-sets" className={linkClass}>
            <ListChecks size={18} className="me-2" />
            質問セット
          </NavLink>
          <button onClick={handleLogout} className="nav-link d-flex align-items-center py-2 border-0 bg-transparent text-body">
            <LogOut size={18} className="me-2" />
            ログアウト
          </button>
        </Nav>
      </div>
      <main className="flex-grow-1 p-4" style={{ backgroundColor: '#ffffff', overflowX: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};
