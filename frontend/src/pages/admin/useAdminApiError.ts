import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ApiError } from '../../lib/api';

/**
 * 管理ページ共通の API エラー処理。
 * - 401（セッション切れ）: 管理者ログインへ誘導し true を返す（呼び出し側は処理を打ち切る）
 * - それ以外: fallbackMessage（または ApiError のメッセージ）をトースト表示し false を返す
 */
export const useAdminApiError = () => {
  const navigate = useNavigate();

  return useCallback(
    (err: unknown, fallbackMessage?: string): boolean => {
      if (err instanceof ApiError && err.status === 401) {
        navigate('/admin/login');
        return true;
      }
      // fallbackMessage 省略時はトーストを出さない（初期ロード等、従来サイレントだった箇所用）
      if (fallbackMessage !== undefined) {
        toast.error(err instanceof ApiError ? err.message : fallbackMessage);
      }
      return false;
    },
    [navigate]
  );
};
