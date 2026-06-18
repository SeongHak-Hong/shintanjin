import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { ROUTE_ADMIN_LOGIN } from '../constants/routes';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 환경변수가 설정되지 않은 경우 (데모 시뮬레이션 모드)
    const isSimulated = !import.meta.env.VITE_FIREBASE_API_KEY || 
                        import.meta.env.VITE_FIREBASE_API_KEY === "ApiKeyHere";

    if (isSimulated) {
      // 로컬 스토리지에서 데모 세션 정보 확인
      const demoSession = sessionStorage.getItem("demo_admin_logged_in");
      if (demoSession === "true") {
        setUser({ email: "admin@church.com", uid: "demo-user" });
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    // 실제 Firebase Auth 구독
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'var(--font-twk-lausanne)',
        color: 'var(--color-slate-blue)',
        backgroundColor: 'var(--color-paper-white)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid var(--color-ash)',
            borderTop: '2px solid var(--color-coral-red)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <span>보안 인증 확인 중...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTE_ADMIN_LOGIN} replace />;
  }

  return children;
}
