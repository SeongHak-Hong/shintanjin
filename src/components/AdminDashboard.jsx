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
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_today</span>
    )},
    { id: 'news', label: '교회 소식', icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>article</span>
    )},
    { id: 'bulletin', label: '주보 업로드', icon: (
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>book</span>
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
              backgroundColor: 'var(--color-coral-red)',
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
                    color: isActive ? 'var(--color-coral-red)' : 'var(--color-slate)',
                    fontSize: '14px',
                    fontWeight: isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--color-iris-glow)';
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
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>logout</span>
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
