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
const DEFAULT_SCHEDULES = [
  { id: 'demo-1', date: '2026-06-21', title: '설립 20주년 기념 감사 예배', time: '11:00', location: '본당 대예배실', category: '예배' },
  { id: 'demo-2', date: '2026-06-23', title: '시니어 바둑 교실 개강', time: '10:00', location: '문화센터실', category: '행사' },
  { id: 'demo-3', date: '2026-06-24', title: '수요 기도회', time: '19:30', location: '소예배실', category: '예배' }
];

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 모달 입력 필드 상태
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null이면 추가, id가 있으면 수정
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    time: '',
    location: '',
    category: '예배'
  });

  // 환경 분석 및 데이터 로드
  useEffect(() => {
    const isSimulated = !import.meta.env.VITE_FIREBASE_API_KEY || 
                        import.meta.env.VITE_FIREBASE_API_KEY === "ApiKeyHere";
    setIsDemoMode(isSimulated);

    if (isSimulated) {
      // 데모 모드: 로컬 스토리지 사용
      const localData = localStorage.getItem('demo_schedules');
      if (localData) {
        setSchedules(JSON.parse(localData));
      } else {
        localStorage.setItem('demo_schedules', JSON.stringify(DEFAULT_SCHEDULES));
        setSchedules(DEFAULT_SCHEDULES);
      }
      setLoading(false);
    } else {
      // 실제 Firebase Firestore 연동
      const q = query(collection(db, 'schedules'), orderBy('date', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        // 날짜순 정렬 보완
        setSchedules(list);
        setLoading(false);
      }, (error) => {
        console.error("Firestore Schedule Load Error:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  // 모달 열기 (추가 모드)
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      title: '',
      time: '11:00',
      location: '',
      category: '예배'
    });
    setShowModal(true);
  };

  // 모달 열기 (수정 모드)
  const handleOpenEdit = (schedule) => {
    setEditingId(schedule.id);
    setFormData({
      date: schedule.date,
      title: schedule.title,
      time: schedule.time,
      location: schedule.location,
      category: schedule.category
    });
    setShowModal(true);
  };

  // 저장 처리 (추가 또는 수정)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      alert('날짜와 일정명은 필수 입력 항목입니다.');
      return;
    }

    if (isDemoMode) {
      let updatedList = [...schedules];
      if (editingId) {
        // 수정
        updatedList = updatedList.map(item => 
          item.id === editingId ? { ...item, ...formData } : item
        );
      } else {
        // 추가
        const newSchedule = {
          id: `demo-${Date.now()}`,
          ...formData
        };
        updatedList.push(newSchedule);
      }
      // 날짜 및 시간 기준 정렬
      updatedList.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      localStorage.setItem('demo_schedules', JSON.stringify(updatedList));
      setSchedules(updatedList);
      setShowModal(false);
    } else {
      try {
        if (editingId) {
          // Firebase 수정
          const docRef = doc(db, 'schedules', editingId);
          await updateDoc(docRef, formData);
        } else {
          // Firebase 추가
          await addDoc(collection(db, 'schedules'), formData);
        }
        setShowModal(false);
      } catch (err) {
        console.error("Save Schedule Error:", err);
        alert("일정 저장에 실패했습니다.");
      }
    }
  };

  // 삭제 처리
  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 일정을 삭제하시겠습니까?')) return;

    if (isDemoMode) {
      const updatedList = schedules.filter(item => item.id !== id);
      localStorage.setItem('demo_schedules', JSON.stringify(updatedList));
      setSchedules(updatedList);
    } else {
      try {
        await deleteDoc(doc(db, 'schedules', id));
      } catch (err) {
        console.error("Delete Schedule Error:", err);
        alert("일정 삭제에 실패했습니다.");
      }
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
            일정 관리
          </h2>
          <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-steel)', marginTop: '4px' }}>
            예배, 행사 및 모임 일정을 CRUD(조회, 추가, 수정, 삭제)합니다.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          style={{
            backgroundColor: 'var(--color-violet-pulse)',
            color: 'var(--color-paper-white)',
            border: 'none',
            borderRadius: 'var(--radius-buttons)', // 9999px
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
          <span>+</span> 일정 추가
        </button>
      </div>

      {/* 로딩 표시 */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-steel)' }}>
          일정 목록 로딩 중...
        </div>
      ) : schedules.length === 0 ? (
        <div style={{
          padding: '80px 0',
          textAlign: 'center',
          border: '1px dashed var(--color-ash)',
          borderRadius: '8px',
          color: 'var(--color-steel)',
          fontSize: 'var(--text-body)'
        }}>
          등록된 일정이 없습니다. 우측 상단의 '일정 추가' 단추를 눌러 새 일정을 등록해 주세요.
        </div>
      ) : (
        /* 일정 테이블 */
        <div style={{
          backgroundColor: 'var(--color-paper-white)',
          border: '1px solid var(--color-ash)',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-subtle-2)'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 'var(--text-body)'
          }}>
            <thead>
              <tr style={{
                backgroundColor: 'var(--color-bone)',
                borderBottom: '1px solid var(--color-ash)',
                color: 'var(--color-slate)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                <th style={{ padding: '14px 18px', width: '120px' }}>날짜</th>
                <th style={{ padding: '14px 18px', width: '100px' }}>분류</th>
                <th style={{ padding: '14px 18px' }}>일정명</th>
                <th style={{ padding: '14px 18px', width: '100px' }}>시간</th>
                <th style={{ padding: '14px 18px', width: '180px' }}>장소</th>
                <th style={{ padding: '14px 18px', width: '120px', textAlign: 'right' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr key={schedule.id} style={{
                  borderBottom: '1px solid var(--color-ash)',
                  color: 'var(--color-iron)',
                  transition: 'background-color 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bone)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '14px 18px', fontWeight: 'var(--font-weight-medium)' }}>
                    {schedule.date}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      display: 'inline-block',
                      backgroundColor: schedule.category === '예배' ? 'var(--color-lavender-wash)' : '#f0fdf4',
                      color: schedule.category === '예배' ? 'var(--color-violet-pulse)' : '#166534',
                      fontSize: '11px',
                      fontWeight: 'var(--font-weight-bold)',
                      padding: '2px 8px',
                      borderRadius: '9999px'
                    }}>
                      {schedule.category}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--color-graphite)', fontWeight: 'var(--font-weight-medium)' }}>
                    {schedule.title}
                  </td>
                  <td style={{ padding: '14px 18px' }}>{schedule.time || '-'}</td>
                  <td style={{ padding: '14px 18px' }}>{schedule.location || '-'}</td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {/* 수정 버튼 */}
                      <button
                        onClick={() => handleOpenEdit(schedule)}
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
                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => handleDelete(schedule.id)}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 일정 추가 / 수정 모달 다이얼로그 */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(29, 29, 32, 0.45)', // Graphite-toned dim
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
            maxWidth: '480px',
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
                {editingId ? '일정 수정하기' : '새 일정 추가하기'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* 날짜 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>날짜</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    style={{
                      border: '1px solid var(--color-mist)',
                      borderRadius: 'var(--radius-inputs)',
                      padding: '8px 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                {/* 분류 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>분류</label>
                  <select 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    style={{
                      border: '1px solid var(--color-mist)',
                      borderRadius: 'var(--radius-inputs)',
                      padding: '8px 12px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="예배">예배</option>
                    <option value="모임">모임</option>
                    <option value="행사">행사</option>
                  </select>
                </div>
              </div>

              {/* 일정명 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>일정명</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="예: 여름 성경학교 오리엔테이션"
                  style={{
                    border: '1px solid var(--color-mist)',
                    borderRadius: 'var(--radius-inputs)',
                    padding: '8px 12px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                {/* 시간 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>시간</label>
                  <input 
                    type="time" 
                    value={formData.time} 
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    style={{
                      border: '1px solid var(--color-mist)',
                      borderRadius: 'var(--radius-inputs)',
                      padding: '8px 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                {/* 장소 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>장소</label>
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="예: 교육관 2층 소강당"
                    style={{
                      border: '1px solid var(--color-mist)',
                      borderRadius: 'var(--radius-inputs)',
                      padding: '8px 12px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
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
