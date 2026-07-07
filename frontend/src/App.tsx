import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApplicantLoginPage, ConnectionConfirmationPage, ComponentTestPage, InterviewPage, FinishPage } from '@/pages'; // Add InterviewPage & FinishPage
// import React from 'react'; // React is needed for JSX (even if not explicitly used) - Removed
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify CSS

function App() {
  const handleStartInterview = () => {
    alert('面接が開始されます！（モック）');
    // 実際には面接画面に遷移するなどの処理
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* ルートパスはログイン画面にリダイレクト */}
        <Route path="/" element={<Navigate to="/applicant/login" replace />} />

        {/* 応募者向けページ */}
        <Route path="/applicant/login" element={<ApplicantLoginPage />} />
        <Route
          path="/applicant/confirmation"
          element={<ConnectionConfirmationPage onStartInterview={handleStartInterview} />}
        />
        {/* AI面接実施中画面 */}
        <Route path="/applicant/interview" element={<InterviewPage />} />
        {/* 面接終了画面 */}
        <Route path="/applicant/finish" element={<FinishPage />} />

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