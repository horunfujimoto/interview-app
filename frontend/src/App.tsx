import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ApplicantLoginPage, ConnectionConfirmationPage, ComponentTestPage } from '@/pages';
import React from 'react'; // React is needed for JSX (even if not explicitly used)

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

        {/* コンポーネントテスト用ページ */}
        <Route path="/components" element={<ComponentTestPage />} />

        {/* 404 Not Found ページ (オプション) */}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;