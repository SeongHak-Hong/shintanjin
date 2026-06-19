import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MainPage from './components/MainPage';
import UserChatbot from './components/UserChatbot';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import SchedulePage from './components/SchedulePage';
import { ROUTE_MAIN, ROUTE_CHATBOT, ROUTE_ADMIN_LOGIN, ROUTE_ADMIN_DASHBOARD, ROUTE_SCHEDULE } from './constants/routes';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* 신탄진침례교회 메인 랜딩 페이지 */}
        <Route path={ROUTE_MAIN} element={<MainPage />} />

        {/* 일반 사용자용 음성 비서 챗봇 페이지 */}
        <Route path={ROUTE_CHATBOT} element={<UserChatbot />} />

        {/* 교회 일정 페이지 */}
        <Route path={ROUTE_SCHEDULE} element={<SchedulePage />} />

        {/* 비공개 관리자 로그인 페이지 */}
        <Route path={ROUTE_ADMIN_LOGIN} element={<AdminLogin />} />

        {/* 비공개 관리자 대시보드 (Protected Route 적용) */}
        <Route
          path={ROUTE_ADMIN_DASHBOARD}
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* 예외 처리: 지정되지 않은 주소는 메인으로 이동 */}
        <Route path="*" element={<MainPage />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize Lenis global smooth scroll
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.8,
    });

    // Main animation frame scroll binding
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Sync with GSAP ScrollTrigger updates
    lenis.on('scroll', ScrollTrigger.update);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
