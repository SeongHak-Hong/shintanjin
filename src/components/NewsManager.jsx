import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';

// 데모 초기 데이터
const DEFAULT_NEWS = [
  { 
    id: 'demo-n1', 
    createdAt: '2026-06-14T10:00:00.000Z', 
    title: '설립 20주년 기념 떡 나눔 행사 안내', 
    content: '이번 주 일요일 대예배 후 친교실에서 설립 20주년을 맞아 감사 기념 떡 나눔 행사가 진행됩니다. 예배 및 점심 식사 종료 후 친교실에서 받아가시기 바랍니다.', 
    isPinned: true 
  },
  { 
    id: 'demo-n2', 
    createdAt: '2026-06-15T09:00:00.000Z', 
    title: '여름 성경학교 교사 모집', 
    content: '여름 성경학교를 기도로 섬겨주실 보조 및 정교사 모집이 진행 중입니다. 교육관 1층 로비 신청대에서 이름과 연락처를 남겨주세요.', 
    isPinned: false 
  }
];

export default function NewsManager() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 모달 입력 필드 상태
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null이면 추가, id가 있으면 수정
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPinned: false
  });

  // 데이터 로드
  useEffect(() => {
    const isSimulated = !import.meta.env.VITE_FIREBASE_API_KEY || 
                        import.meta.env.VITE_FIREBASE_API_KEY === "ApiKeyHere";
    setIsDemoMode(isSimulated);

    if (isSimulated) {
      // 데모 모드: 로컬 스토리지 사용
      const localData = localStorage.getItem('demo_news');
      if (localData) {
        setNewsList(JSON.parse(localData));
      } else {
        localStorage.setItem('demo_news', JSON.stringify(DEFAULT_NEWS));
        setNewsList(DEFAULT_NEWS);
      }
      setLoading(false);
    } else {
      // 실제 Firebase Firestore 연동
      const q = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Firestore 타임스탬프를 ISO 스트링으로 포맷
          let createdAtStr = new Date().toISOString();
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            createdAtStr = data.createdAt.toDate().toISOString();
          } else if (data.createdAt) {
            createdAtStr = new Date(data.createdAt).toISOString();
          }
          list.push({ 
            id: doc.id, 
            ...data,
            createdAt: createdAtStr
          });
        });

        // 상단 고정(isPinned)이 먼저 오고, 그 다음 최신순 정렬
        list.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setNewsList(list);
        setLoading(false);
      }, (error) => {
        console.error("Firestore News Load Error:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  // 상단 고정순 및 최신순 정렬 유틸리티
  const sortNews = (list) => {
    return [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  // 모달 열기 (추가 모드)
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      isPinned: false
    });
    setShowModal(true);
  };

  // 모달 열기 (수정 모드)
  const handleOpenEdit = (news) => {
    setEditingId(news.id);
    setFormData({
      title: news.title,
      content: news.content,
      isPinned: news.isPinned || false
    });
    setShowModal(true);
  };

  // 저장 처리
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('제목과 내용은 필수 입력 항목입니다.');
      return;
    }

    if (isDemoMode) {
      let updatedList = [...newsList];
      if (editingId) {
        // 수정
        updatedList = updatedList.map(item => 
          item.id === editingId ? { ...item, ...formData } : item
        );
      } else {
        // 추가
        const newNews = {
          id: `demo-n-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...formData
        };
        updatedList.push(newNews);
      }
      const sorted = sortNews(updatedList);
      localStorage.setItem('demo_news', JSON.stringify(sorted));
      setNewsList(sorted);
      setShowModal(false);
    } else {
      try {
        const payload = {
          title: formData.title,
          content: formData.content,
          isPinned: formData.isPinned
        };

        if (editingId) {
          // Firebase 수정
          const docRef = doc(db, 'news', editingId);
          await updateDoc(docRef, payload);
        } else {
          // Firebase 추가 - 현재 서버 시간으로 설정
          await addDoc(collection(db, 'news'), {
            ...payload,
            createdAt: new Date().toISOString()
          });
        }
        setShowModal(false);
      } catch (err) {
        console.error("Save News Error:", err);
        alert("교회 소식 저장에 실패했습니다.");
      }
    }
  };

  // 삭제 처리
  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 소식을 삭제하시겠습니까?')) return;

    if (isDemoMode) {
      const updatedList = newsList.filter(item => item.id !== id);
      localStorage.setItem('demo_news', JSON.stringify(updatedList));
      setNewsList(updatedList);
    } else {
      try {
        await deleteDoc(doc(db, 'news', id));
      } catch (err) {
        console.error("Delete News Error:", err);
        alert("소식 삭제에 실패했습니다.");
      }
    }
  };

  // 날짜 간이 포맷터 (YYYY-MM-DD)
  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return '-';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 타이틀 및 추가 버튼 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-ash)',
        paddingBottom: '16px'
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-moderat-serif)',
            fontSize: 'var(--text-heading-sm)',
            fontWeight: 'var(--font-weight-light)',
            color: 'var(--color-graphite)'
          }}>
            교회 소식 관리
          </h2>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-steel)', marginTop: '4px' }}>
            새 소식을 공지하고 관리합니다. 상단 고정 소식은 최상단에 노출됩니다.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          style={{
            backgroundColor: 'var(--color-violet-pulse)',
            color: 'var(--color-paper-white)',
            border: 'none',
            borderRadius: 'var(--radius-buttons)',
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 'var(--font-weight-medium)',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <span>+</span> 소식 작성
        </button>
      </div>

      {/* 로딩 표시 */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-steel)' }}>
          소식 로딩 중...
        </div>
      ) : newsList.length === 0 ? (
        <div style={{
          padding: '80px 0',
          textAlign: 'center',
          border: '1px dashed var(--color-ash)',
          borderRadius: '8px',
          color: 'var(--color-steel)',
          fontSize: 'var(--text-body)'
        }}>
          등록된 교회 소식이 없습니다. 우측 상단의 '소식 작성' 단추를 눌러 첫 소식을 알려주세요.
        </div>
      ) : (
        /* 소식 카드형 게시판 */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {newsList.map((news) => (
            <div 
              key={news.id} 
              style={{
                backgroundColor: 'var(--color-paper-white)',
                border: news.isPinned ? '1px solid var(--color-violet-pulse)' : '1px solid var(--color-ash)',
                borderRadius: '8px',
                padding: '20px 24px',
                boxShadow: news.isPinned ? '0 0 10px rgba(165,101,255,0.05)' : 'var(--shadow-subtle-2)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* 상단 메타 정보 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {news.isPinned && (
                    <span style={{
                      backgroundColor: 'var(--color-lavender-wash)',
                      color: 'var(--color-violet-pulse)',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-bold)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      📌 필독 공지
                    </span>
                  )}
                  <span style={{ fontSize: '12px', color: 'var(--color-steel)' }}>
                    등록일: {formatDate(news.createdAt)}
                  </span>
                </div>

                {/* 제어 버튼 */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleOpenEdit(news)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-indigo-ink)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(news.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#d32f2f',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>

              {/* 제목 */}
              <h3 style={{
                fontFamily: 'var(--font-twk-lausanne)',
                fontSize: '16px',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-graphite)'
              }}>
                {news.title}
              </h3>

              {/* 내용 */}
              <p style={{
                fontSize: '14px',
                color: 'var(--color-iron)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {news.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 소식 작성/수정 모달 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(29, 29, 32, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-paper-white)',
            border: '1px solid var(--color-ash)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: 'var(--shadow-subtle-9)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* 모달 헤더 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-ash)',
              backgroundColor: 'var(--color-bone)'
            }}>
              <h3 style={{
                fontFamily: 'var(--font-twk-lausanne)',
                fontSize: '16px',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-graphite)'
              }}>
                {editingId ? '교회 소식 수정하기' : '새 소식 올리기'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--color-steel)'
                }}
              >
                &times;
              </button>
            </div>

            {/* 모달 폼 바디 */}
            <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* 상단 고정 여부 체크 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--color-bone)',
                padding: '10px 14px',
                borderRadius: '4px',
                border: '1px solid var(--color-ash)'
              }}>
                <input 
                  type="checkbox" 
                  id="isPinned"
                  checked={formData.isPinned} 
                  onChange={(e) => setFormData({...formData, isPinned: e.target.checked})}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="isPinned" style={{
                  fontSize: '13px',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-graphite)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  📌 이 공지사항을 게시판 맨 위에 고정합니다 (필독 공지)
                </label>
              </div>

              {/* 제목 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>소식 제목</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="예: 설립 20주년 기념 감사 예배 및 떡 나눔 안내"
                  style={{
                    border: '1px solid var(--color-mist)',
                    borderRadius: 'var(--radius-inputs)',
                    padding: '10px 12px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* 내용 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>공지 내용</label>
                <textarea 
                  value={formData.content} 
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="방문자들이 확인할 수 있도록 공지 상세 내용을 적어주세요."
                  rows="6"
                  style={{
                    border: '1px solid var(--color-mist)',
                    borderRadius: 'var(--radius-inputs)',
                    padding: '10px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* 하단 제어 */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '12px',
                borderTop: '1px solid var(--color-ash)',
                paddingTop: '16px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    backgroundColor: 'var(--color-paper-white)',
                    border: '1px solid var(--color-ash)',
                    borderRadius: 'var(--radius-buttons)',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    color: 'var(--color-graphite)',
                    boxShadow: 'var(--shadow-subtle-2)'
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: 'var(--color-violet-pulse)',
                    border: 'none',
                    borderRadius: 'var(--radius-buttons)',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    color: 'var(--color-paper-white)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
