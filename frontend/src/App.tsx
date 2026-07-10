import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApplicantLoginPage, ConnectionConfirmationPage, ComponentTestPage, InterviewPage, FinishPage } from '@/pages'; // Add InterviewPage & FinishPage
import {
  AdminLoginPage,
  AdminMfaPage,
  AdminLayout,
  AdminInterviewsPage,
  AdminInterviewNewPage,
  AdminInterviewDetailPage,
  AdminQuestionSetsPage,
  AdminAuditLogsPage,
} from './pages/admin';
// import React from 'react'; // React is needed for JSX (even if not explicitly used) - Removed
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify CSS

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ルートパスはログイン画面にリダイレクト */}
        <Route path="/" element={<Navigate to="/applicant/login" replace />} />

        {/* 応募者向けページ */}
        <Route path="/applicant/login" element={<ApplicantLoginPage />} />
        <Route path="/applicant/confirmation" element={<ConnectionConfirmationPage />} />
        {/* AI面接実施中画面 */}
        <Route path="/applicant/interview" element={<InterviewPage />} />
        {/* 面接終了画面 */}
        <Route path="/applicant/finish" element={<FinishPage />} />

        {/* 管理者向けページ */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/mfa" element={<AdminMfaPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/interviews" replace />} />
          <Route path="interviews" element={<AdminInterviewsPage />} />
          <Route path="interviews/new" element={<AdminInterviewNewPage />} />
          <Route path="interviews/:id" element={<AdminInterviewDetailPage />} />
          <Route path="question-sets" element={<AdminQuestionSetsPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        </Route>

        {/* コンポーネントテスト用ページ */}
        <Route path="/components" element={<ComponentTestPage />} />

        {/* 404 Not Found ページ (オプション) */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </BrowserRouter>
  );
}

export default App;