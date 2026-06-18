import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { ROUTE_ADMIN_DASHBOARD } from '../constants/routes';
import useNoIndex from '../hooks/useNoIndex';

export default function AdminLogin() {
  // SEO 로봇 수집 거부 훅 동적 적용
  useNoIndex();

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 현재 환경이 Firebase 연동 시뮬레이션 상태인지 감지
  useEffect(() => {
    const isSimulated = !import.meta.env.VITE_FIREBASE_API_KEY || 
                        import.meta.env.VITE_FIREBASE_API_KEY === "ApiKeyHere";
    setIsDemoMode(isSimulated);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setError('');
    setLoading(true);

    if (isDemoMode) {
      // 데모 시뮬레이션 모드 로그인 처리
      setTimeout(() => {
        if (email === 'admin@church.com' && password === 'admin1234') {
          sessionStorage.setItem('demo_admin_logged_in', 'true');
          setLoading(false);
          navigate(ROUTE_ADMIN_DASHBOARD);
        } else {
          setError('이메일 또는 비밀번호가 올바르지 않습니다. (데모 계정: admin@church.com / admin1234)');
          setLoading(false);
        }
      }, 1000);
      return;
    }

    try {
      // Firebase 실제 로그인
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigate(ROUTE_ADMIN_DASHBOARD);
    } catch (err) {
      console.error('Login Error:', err);
      let errMsg = '로그인에 실패했습니다. 정보를 다시 확인해 주세요.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = '이메일 또는 비밀번호가 일치하지 않습니다.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = '올바르지 않은 이메일 형식입니다.';
      }
      setError(errMsg);
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bone)',
      fontFamily: 'var(--font-twk-lausanne)',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--color-paper-white)',
        border: '1px solid var(--color-ash)',
        borderRadius: '8px',
        padding: '32px',
        boxShadow: 'var(--shadow-subtle)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* 헤더 부분 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-lavender-wash)',
            border: '1px solid var(--color-ash)',
            marginBottom: '16px'
          }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-coral-red)' }}>lock</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-moderat-serif)',
            fontSize: 'var(--text-heading-sm)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-graphite)',
            letterSpacing: '-0.02em',
            marginBottom: '8px'
          }}>
            교회 관리 라운지
          </h1>
          <p style={{
            fontSize: 'var(--text-body)',
            color: 'var(--color-steel)'
          }}>
            프라이빗 행정 시스템에 로그인합니다.
          </p>
        </div>

        {/* 데모 안내 배너 */}
        {isDemoMode && (
          <div style={{
            backgroundColor: 'var(--color-marble)',
            border: '1px solid var(--color-ash)',
            borderRadius: '4px',
            padding: '12px',
            fontSize: '12px',
            lineHeight: '1.5',
            color: 'var(--color-graphite)'
          }}>
            💡 <strong>데모 시뮬레이션 모드 활성화됨</strong><br />
            파이어베이스 정보가 없으므로 아래의 공용 계정으로 로그인해 주세요.<br />
            - 이메일: <code style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '2px' }}>admin@church.com</code><br />
            - 비밀번호: <code style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '2px' }}>admin1234</code>
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="email" style={{
              fontSize: '12px',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-slate)'
            }}>
              이메일 주소
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@church.com"
              disabled={loading}
              style={{
                backgroundColor: 'var(--color-paper-white)',
                border: '1px solid var(--color-ash)',
                borderRadius: 'var(--radius-inputs)',
                padding: '10px 12px',
                fontSize: 'var(--text-body)',
                color: 'var(--color-graphite)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-coral-red)';
                e.target.style.boxShadow = '0 0 0 2px var(--color-lavender-wash)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-ash)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="password" style={{
              fontSize: '12px',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-slate)'
            }}>
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              style={{
                backgroundColor: 'var(--color-paper-white)',
                border: '1px solid var(--color-ash)',
                borderRadius: 'var(--radius-inputs)',
                padding: '10px 12px',
                fontSize: 'var(--text-body)',
                color: 'var(--color-graphite)',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-coral-red)';
                e.target.style.boxShadow = '0 0 0 2px var(--color-lavender-wash)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-ash)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <div style={{
              fontSize: '13px',
              color: '#d32f2f',
              backgroundColor: '#ffebee',
              border: '1px solid #ffcdd2',
              borderRadius: '4px',
              padding: '8px 12px',
              lineHeight: '1.4'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: 'var(--color-coral-red)',
              color: 'var(--color-paper-white)',
              border: 'none',
              borderRadius: 'var(--radius-buttons)',
              padding: '12px',
              fontSize: 'var(--text-body)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.15s, opacity 0.15s',
              marginTop: '8px',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.opacity = '0.9';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.opacity = '1';
            }}
            onMouseDown={(e) => {
              if (!loading) e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              if (!loading) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {loading ? '인증 진행 중...' : '보안 로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
