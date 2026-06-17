import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { ROUTE_ADMIN_LOGIN } from '../constants/routes';
import useNoIndex from '../hooks/useNoIndex';

// CRUD 메뉴 컴포넌트 임포트 (이후 개별 파일로 구현함)
import ScheduleManager from './ScheduleManager';
import NewsManager from './NewsManager';
import BulletinManager from './BulletinManager';

export default function AdminDashboard() {
  // SEO 로봇 수집 거부 훅 동적 적용
  useNoIndex();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('schedule'); // schedule | news | bulletin
  const [userEmail, setUserEmail] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // 환경 파악
    const isSimulated = !import.meta.env.VITE_FIREBASE_API_KEY || 
                        import.meta.env.VITE_FIREBASE_API_KEY === "ApiKeyHere";
    setIsDemoMode(isSimulated);

    if (isSimulated) {
      setUserEmail('admin@church.com (데모)');
    } else {
      setUserEmail(auth.currentUser?.email || '관리자');
    }
  }, []);

  const handleLogout = async () => {
    if (isDemoMode) {
      sessionStorage.removeItem('demo_admin_logged_in');
      navigate(ROUTE_ADMIN_LOGIN);
      return;
    }

    try {
      await signOut(auth);
      navigate(ROUTE_ADMIN_LOGIN);
    } catch (err) {
      console.error('Logout Error:', err);
      alert('로그아웃 과정에서 오류가 발생했습니다.');
    }
  };

  // 탭 목록 정의
  const tabs = [
    { id: 'schedule', label: '일정 관리', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )},
    { id: 'news', label: '교회 소식', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )},
    { id: 'bulletin', label: '주보 업로드', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    )},
  ];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: 'var(--color-paper-white)',
      fontFamily: 'var(--font-twk-lausanne)',
      overflow: 'hidden'
    }}>
      {/* 1. 사이드바 네비게이션 */}
      <aside style={{
        width: '260px',
        backgroundColor: 'var(--color-bone)',
        borderRight: '1px solid var(--color-ash)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* 상단 로고 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 8px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-violet-pulse)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              †
            </div>
            <span style={{
              fontSize: '16px',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-graphite)',
              letterSpacing: '-0.01em'
            }}>
              행정 라운지
            </span>
          </div>

          {/* 메뉴 리스트 */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-buttons)', // 9999px
                    border: 'none',
                    backgroundColor: isActive ? 'var(--color-lavender-wash)' : 'transparent',
                    color: isActive ? 'var(--color-violet-pulse)' : 'var(--color-slate)',
                    fontSize: '14px',
                    fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--color-fog)';
                      e.currentTarget.style.color = 'var(--color-graphite)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-slate)';
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 하단 유저 프로필 및 로그아웃 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderTop: '1px solid var(--color-ash)',
          paddingTop: '20px'
        }}>
          <div style={{ padding: '0 8px' }}>
            <p style={{
              fontSize: '11px',
              color: 'var(--color-steel)',
              marginBottom: '4px'
            }}>
              로그인 계정
            </p>
            <p style={{
              fontSize: '13px',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-graphite)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {userEmail}
            </p>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px',
              borderRadius: 'var(--radius-buttons)',
              border: '1px solid var(--color-ash)',
              backgroundColor: 'var(--color-paper-white)',
              color: 'var(--color-graphite)',
              fontSize: '13px',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-subtle-2)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bone)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-paper-white)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            보안 로그아웃
          </button>
        </div>
      </aside>

      {/* 2. 메인 콘텐츠 렌더링 영역 */}
      <main style={{
        flex: 1,
        height: '100vh',
        overflowY: 'auto',
        backgroundColor: 'var(--color-paper-white)',
        padding: '40px',
        boxSizing: 'border-box'
      }}>
        {activeTab === 'schedule' && <ScheduleManager />}
        {activeTab === 'news' && <NewsManager />}
        {activeTab === 'bulletin' && <BulletinManager />}
      </main>
    </div>
  );
}
