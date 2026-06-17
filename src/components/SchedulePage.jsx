import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_SCHEDULES = [
  { id: 'demo-1', date: '2026-06-21', title: '주일 대예배', time: '11:00', location: '본당 2층', category: '예배' },
  { id: 'demo-2', date: '2026-06-21', title: '전교인 체육대회 준비 모임', time: '13:30', location: '비전홀', category: '모임' },
  { id: 'demo-3', date: '2026-06-24', title: '수요 기도회', time: '19:30', location: '본당 1층 소예배실', category: '예배' },
  { id: 'demo-4', date: '2026-06-28', title: '상반기 결산 제직회', time: '13:00', location: '본당 2층', category: '행사' }
];

const DAYS = ['주일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hourStr, minuteStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour < 12 ? '오전' : '오후';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${ampm} ${hour}:${minuteStr}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return { date: '', day: '' };
  const d = new Date(dateStr);
  return {
    date: `${d.getMonth() + 1}월 ${d.getDate()}일`,
    day: DAYS[d.getDay()]
  };
};

export default function SchedulePage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth, 1));
  };

  useEffect(() => {
    const isSimulated = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY === "ApiKeyHere";
    
    if (isSimulated) {
      const localData = localStorage.getItem('demo_schedules');
      if (localData) {
        setSchedules(JSON.parse(localData));
      } else {
        setSchedules(DEFAULT_SCHEDULES);
      }
      setLoading(false);
    } else {
      const q = query(collection(db, 'schedules'), orderBy('date', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        // 날짜 및 시간순 정렬 (관리자 페이지와 동일한 로직 적용)
        list.sort((a, b) => {
          const dateA = a.date || '';
          const dateB = b.date || '';
          const timeA = a.time || '';
          const timeB = b.time || '';
          return dateA.localeCompare(dateB) || timeA.localeCompare(timeB);
        });

        setSchedules(list);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fafcff', // 깨끗한 오프화이트 배경
      padding: '80px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Title & Month Navigation */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        marginBottom: '48px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            backgroundColor: 'var(--color-lavender-wash)',
            color: 'var(--color-violet-pulse)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={24} />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-moderat-serif)',
            fontSize: '24px',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-graphite)',
            margin: 0
          }}>
            교회 일정
          </h1>
        </div>

        {/* Month Navigator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: 'var(--color-paper-white)',
          padding: '8px 16px',
          borderRadius: '9999px',
          border: '1px solid var(--color-mist)',
        }}>
          <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-slate)' }}>
            <ChevronLeft size={20} />
          </button>
          <span style={{
            fontFamily: 'var(--font-moderat-serif)',
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--color-graphite)',
            minWidth: '100px',
            textAlign: 'center'
          }}>
            {currentYear}년 {currentMonth}월
          </span>
          <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--color-slate)' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Schedule List */}
      <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--color-steel)' }}>일정을 불러오는 중입니다...</div>
        ) : (
          (() => {
            const filteredSchedules = schedules.filter((s) => {
              if (!s.date) return false;
              const d = new Date(s.date);
              return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth;
            });
            
            if (filteredSchedules.length === 0) {
              return <div style={{ textAlign: 'center', color: 'var(--color-steel)' }}>해당 월에 등록된 일정이 없습니다.</div>;
            }

            return filteredSchedules.map((schedule, index) => {
              const { date, day } = formatDate(schedule.date);
              const time = formatTime(schedule.time);
              
              // 이전 일정과 같은 날짜인지 확인 (같은 날짜면 날짜 표시 생략하여 여백만 유지)
              const isSameAsPreviousDate = index > 0 && filteredSchedules[index - 1].date === schedule.date;

            return (
              <div key={schedule.id} style={{
                display: 'flex',
                gap: '24px',
                alignItems: 'flex-start'
              }}>
                {/* Left: Date & Day */}
                <div style={{
                  width: '100px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  opacity: isSameAsPreviousDate ? 0 : 1 // 같은 날짜일 경우 숨김 처리
                }}>
                  <div style={{
                    fontFamily: 'var(--font-moderat-serif)',
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--color-graphite)'
                  }}>
                    {date}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: 'var(--color-violet-pulse)',
                    fontWeight: '500'
                  }}>
                    {day}
                  </div>
                </div>

                {/* Right: Card */}
                <div style={{
                  flexGrow: 1,
                  backgroundColor: 'var(--color-paper-white)',
                  border: '1px solid var(--color-iris-glow)', // 섀도우 대신 깔끔한 보더 사용
                  borderRadius: 'var(--radius-cards)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: 'none' // 사용자 요청에 따라 섀도우 제거
                }}>
                  {/* Tag */}
                  <div style={{
                    alignSelf: 'flex-start',
                    backgroundColor: 'var(--color-iris-glow)', 
                    color: 'var(--color-steel)', 
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-badges)'
                  }}>
                    {schedule.category}
                  </div>

                  {/* Title */}
                  <div style={{
                    fontFamily: 'var(--font-moderat-serif)',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'var(--color-graphite)'
                  }}>
                    {schedule.title}
                  </div>

                  {/* Time and Location */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    color: 'var(--color-steel)',
                    fontSize: '14px',
                    marginTop: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} color="var(--color-violet-pulse)" />
                      <span>{time}</span>
                    </div>
                    {schedule.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={16} color="var(--color-violet-pulse)" />
                        <span>{schedule.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })
          })()
        )}
      </div>
    </div>
  );
}
