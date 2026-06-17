import React, { useState, useEffect, useRef } from 'react';
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
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../firebase';

// 데모 초기 데이터
const DEFAULT_BULLETINS = [
  { id: 'demo-b1', date: '2026-06-14', title: '2026년 6월 2주차 주보', fileUrl: '#' }
];

/**
 * 이미지 파일을 브라우저 캔버스를 이용해 WebP 포맷(품질 80%)으로 자동 압축 및 변환합니다.
 * PDF 또는 기타 포맷 파일은 압축 없이 원본 그대로 통과시킵니다.
 */
const convertImageToWebP = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_WIDTH = 1600; // 해상도 상한선 (초고화질 주보 데이터 최적화)

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const originalName = file.name;
            const dotIndex = originalName.lastIndexOf('.');
            const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
            const webpFile = new File([blob], `${baseName}.webp`, {
              type: 'image/webp',
              lastModified: Date.now()
            });
            console.log(`WebP 변환 완료: ${file.name} (${(file.size / 1024).toFixed(1)} KB) -> ${webpFile.name} (${(webpFile.size / 1024).toFixed(1)} KB)`);
            resolve(webpFile);
          } else {
            resolve(file);
          }
        }, 'image/webp', 0.80);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function BulletinManager() {
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // 폼 입력 상태
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 업로드 진행 상태
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // 주보 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState({
    id: '',
    date: '',
    title: '',
    content: ''
  });
  const [editFile, setEditFile] = useState(null);
  const [editUploading, setEditUploading] = useState(false);
  const [editProgress, setEditProgress] = useState(0);

  // 환경 분석 및 데이터 로딩
  useEffect(() => {
    const isSimulated = !import.meta.env.VITE_FIREBASE_API_KEY || 
                        import.meta.env.VITE_FIREBASE_API_KEY === "ApiKeyHere";
    setIsDemoMode(isSimulated);

    if (isSimulated) {
      // 데모 모드 로딩
      const localData = localStorage.getItem('demo_bulletins');
      if (localData) {
        setBulletins(JSON.parse(localData));
      } else {
        localStorage.setItem('demo_bulletins', JSON.stringify(DEFAULT_BULLETINS));
        setBulletins(DEFAULT_BULLETINS);
      }
      setLoading(false);
    } else {
      // 실제 Firebase Firestore 연동
      const q = query(collection(db, 'bulletins'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setBulletins(list);
        setLoading(false);
      }, (error) => {
        console.error("Firestore Bulletin Load Error:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  // 주차 명칭 자동 추천 (날짜 변경 시)
  useEffect(() => {
    if (!date) return;
    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      
      // 월의 몇 번째 주인지 계산
      const firstDayOfMonth = new Date(year, d.getMonth(), 1);
      const firstDayOfWeek = firstDayOfMonth.getDay(); // 0(일요일) ~ 6(토요일)
      
      // 해당 날짜의 일 수
      const dateNum = d.getDate();
      
      // 1주차 주차 계산 로직
      const weekNum = Math.ceil((dateNum + firstDayOfWeek) / 7);
      
      setTitle(`${year}년 ${month}월 ${weekNum}주차 주보`);
    } catch {
      setTitle('');
    }
  }, [date]);

  // 드래그 관련 이벤트
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // 드롭 이벤트
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // 파일 선택 이벤트
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // 파일 업로드 비즈니스 로직
  const handleFileUpload = async (file) => {
    if (!date || !title) {
      alert("날짜와 주보 제목을 입력하신 후 파일을 업로드해 주세요.");
      return;
    }

    setUploading(true);
    setProgress(0);

    // 이미지 파일일 경우 브라우저 레벨에서 WebP로 압축 변환
    const processedFile = await convertImageToWebP(file);

    if (isDemoMode) {
      // 데모 모드: 시뮬레이션 진행률 업데이트
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            
            // 데이터 저장 및 반영
            setTimeout(() => {
              const newBulletin = {
                id: `demo-b-${Date.now()}`,
                date,
                title,
                content,
                fileUrl: '#', // 데모용 더미 다운로드 링크
                fileName: processedFile.name
              };
              const updatedList = [newBulletin, ...bulletins];
              updatedList.sort((a, b) => b.date.localeCompare(a.date));
              localStorage.setItem('demo_bulletins', JSON.stringify(updatedList));
              setBulletins(updatedList);
              setUploading(false);
              setContent('');
              alert("🎉 데모 모드 주보 모의 업로드 완료!");
            }, 500);

            return 100;
          }
          return prev + 10;
        });
      }, 150);
    } else {
      try {
        // 실제 Firebase Storage 업로드
        const fileExtension = processedFile.name.split('.').pop();
        const safeFileName = `bulletin_${date}_${Date.now()}.${fileExtension}`;
        const fileRef = ref(storage, `bulletins/${safeFileName}`);
        
        const uploadTask = uploadBytesResumable(fileRef, processedFile);

        uploadTask.on('state_changed', 
          (snapshot) => {
            // 진행률 계산
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(pct);
          }, 
          (error) => {
            console.error("Storage Upload Error:", error);
            alert("파일 업로드에 실패했습니다: " + error.message);
            setUploading(false);
          }, 
          async () => {
            // 완료 시 다운로드 URL 획득 및 Firestore 기록
            const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
            await addDoc(collection(db, 'bulletins'), {
              date,
              title,
              content,
              fileUrl,
              fileName: processedFile.name,
              createdAt: new Date().toISOString()
            });

            setUploading(false);
            setContent('');
            alert("주보가 성공적으로 등록되었습니다.");
          }
        );
      } catch (err) {
        console.error("Firebase Storage Upload Process Error:", err);
        alert("업로드 처리 도중 에러가 발생했습니다.");
        setUploading(false);
      }
    }
  };

  // 삭제 처리
  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 주보를 삭제하시겠습니까? (파일 링크도 함께 제거됩니다)')) return;

    if (isDemoMode) {
      const updatedList = bulletins.filter(item => item.id !== id);
      localStorage.setItem('demo_bulletins', JSON.stringify(updatedList));
      setBulletins(updatedList);
    } else {
      try {
        await deleteDoc(doc(db, 'bulletins', id));
      } catch (err) {
        console.error("Delete Bulletin Error:", err);
        alert("주보 삭제에 실패했습니다.");
      }
    }
  };

  // 수정 모달 열기
  const handleOpenEdit = (bulletin) => {
    setEditingBulletin({
      id: bulletin.id,
      date: bulletin.date,
      title: bulletin.title,
      content: bulletin.content || ''
    });
    setEditFile(null);
    setEditUploading(false);
    setEditProgress(0);
    setShowEditModal(true);
  };

  // 수정 정보 저장 처리
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingBulletin.title || !editingBulletin.date) {
      alert("날짜와 제목은 필수 입력 항목입니다.");
      return;
    }

    setEditUploading(true);
    setEditProgress(0);

    // 공통 Firestore 업데이트 및 로컬스토리지 갱신 처리
    const saveToFirestore = async (fileUrl = null, fileName = null) => {
      const payload = {
        date: editingBulletin.date,
        title: editingBulletin.title,
        content: editingBulletin.content
      };
      if (fileUrl) {
        payload.fileUrl = fileUrl;
        payload.fileName = fileName;
      }

      if (isDemoMode) {
        const updatedList = bulletins.map(item => 
          item.id === editingBulletin.id 
            ? { ...item, ...payload }
            : item
        );
        updatedList.sort((a, b) => b.date.localeCompare(a.date));
        localStorage.setItem('demo_bulletins', JSON.stringify(updatedList));
        setBulletins(updatedList);
        setEditUploading(false);
        setShowEditModal(false);
        alert("주보 정보 및 파일이 성공적으로 변경되었습니다.");
      } else {
        try {
          const docRef = doc(db, 'bulletins', editingBulletin.id);
          await updateDoc(docRef, payload);
          setEditUploading(false);
          setShowEditModal(false);
          alert("주보 정보가 성공적으로 수정되었습니다.");
        } catch (err) {
          console.error("Update Bulletin Error:", err);
          alert("주보 정보 수정에 실패했습니다.");
          setEditUploading(false);
        }
      }
    };

    if (editFile) {
      // 이미지일 경우 WebP 자동 압축 변환
      const processedEditFile = await convertImageToWebP(editFile);

      if (isDemoMode) {
        // 데모 모드 새 파일 업로드 시뮬레이션
        let pct = 0;
        const interval = setInterval(() => {
          pct += 20;
          setEditProgress(pct);
          if (pct >= 100) {
            clearInterval(interval);
            saveToFirestore('#', processedEditFile.name);
          }
        }, 150);
      } else {
        try {
          const fileExtension = processedEditFile.name.split('.').pop();
          const safeFileName = `bulletin_${editingBulletin.date}_${Date.now()}.${fileExtension}`;
          const fileRef = ref(storage, `bulletins/${safeFileName}`);
          const uploadTask = uploadBytesResumable(fileRef, processedEditFile);

          uploadTask.on('state_changed',
            (snapshot) => {
              const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setEditProgress(pct);
            },
            (error) => {
              console.error("Edit Storage Upload Error:", error);
              alert("새 파일 업로드에 실패했습니다: " + error.message);
              setEditUploading(false);
            },
            async () => {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              await saveToFirestore(downloadUrl, processedEditFile.name);
            }
          );
        } catch (err) {
          console.error("Edit Upload Process Error:", err);
          alert("업로드 처리 중 에러가 발생했습니다.");
          setEditUploading(false);
        }
      }
    } else {
      // 파일 변경 없이 메타데이터만 갱신
      await saveToFirestore();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 타이틀 헤더 */}
      <div style={{
        borderBottom: '1px solid var(--color-ash)',
        paddingBottom: '16px'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-moderat-serif)',
          fontSize: 'var(--text-heading-sm)',
          fontWeight: 'var(--font-weight-light)',
          color: 'var(--color-graphite)'
        }}>
          주보 업로드 관리
        </h2>
        <p style={{ fontSize: 'var(--text-body)', color: 'var(--color-steel)', marginTop: '4px' }}>
          매주 올라가는 주보 파일(PDF 또는 이미지)을 드래그 앤 드롭으로 간편하게 업로드하여 데이터베이스에 저장합니다.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.8fr',
        gap: '32px',
        alignItems: 'start'
      }}>
        {/* 1. 왼쪽: 업로드 폼 및 드래그 앤 드롭 영역 */}
        <div style={{
          backgroundColor: 'var(--color-paper-white)',
          border: '1px solid var(--color-ash)',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: 'var(--shadow-subtle-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-graphite)',
            borderBottom: '1px solid var(--color-ash)',
            paddingBottom: '8px'
          }}>
            신규 주보 등록
          </h3>

          {/* 주일 날짜 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>
              주일 날짜 지정
            </label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              disabled={uploading}
              style={{
                border: '1px solid var(--color-mist)',
                borderRadius: 'var(--radius-inputs)',
                padding: '8px 12px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* 주보 제목 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>
              주보 제목
            </label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              placeholder="예: 2026년 6월 3주차 주보"
              style={{
                border: '1px solid var(--color-mist)',
                borderRadius: 'var(--radius-inputs)',
                padding: '8px 12px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* 주보 텍스트 내용 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>
              주보 텍스트 내용 (챗봇 검색용)
            </label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              disabled={uploading}
              placeholder="예배 순서, 설교 본문, 교회 소식 등 AI 챗봇이 읽고 답변할 핵심 텍스트를 붙여넣어 주세요."
              rows="5"
              style={{
                border: '1px solid var(--color-mist)',
                borderRadius: 'var(--radius-inputs)',
                padding: '8px 12px',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.5'
              }}
            />
          </div>

          {/* 드래그 앤 드롭 업로드 카드 */}
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current.click()}
            style={{
              border: dragActive ? '2px dashed var(--color-violet-pulse)' : '2px dashed var(--color-mist)',
              borderRadius: '6px',
              padding: '40px 20px',
              textAlign: 'center',
              backgroundColor: dragActive ? 'var(--color-lavender-wash)' : 'var(--color-bone)',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}
          >
            <input 
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="application/pdf, image/*"
              style={{ display: 'none' }}
              disabled={uploading}
            />
            
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={dragActive ? 'var(--color-violet-pulse)' : 'var(--color-slate)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>

            <div>
              <p style={{ fontSize: '13px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-graphite)' }}>
                {uploading ? '파일을 저장소에 올리는 중...' : '여기에 주보 파일 드롭 또는 클릭'}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--color-steel)', marginTop: '4px' }}>
                PDF 또는 이미지 파일 호환
              </p>
            </div>
          </div>

          {/* 업로드 진행률 프로그레스 바 */}
          {uploading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-slate)', fontWeight: 'var(--font-weight-semibold)' }}>업로드 진행률</span>
                <span style={{ color: 'var(--color-violet-pulse)', fontWeight: 'var(--font-weight-bold)' }}>{progress}%</span>
              </div>
              <div style={{
                height: '6px',
                backgroundColor: 'var(--color-fog)',
                borderRadius: '9999px',
                overflow: 'hidden',
                border: '1px solid var(--color-ash)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: 'var(--color-violet-pulse)',
                  transition: 'width 0.1s linear',
                  borderRadius: '9999px'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* 2. 오른쪽: 등록된 주보 이력 리스트 */}
        <div style={{
          backgroundColor: 'var(--color-paper-white)',
          border: '1px solid var(--color-ash)',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: 'var(--shadow-subtle-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-graphite)',
            borderBottom: '1px solid var(--color-ash)',
            paddingBottom: '8px'
          }}>
            등록된 주보 이력
          </h3>

          {loading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-steel)' }}>
              주보 목록 로드 중...
            </div>
          ) : bulletins.length === 0 ? (
            <div style={{
              padding: '40px 0',
              textAlign: 'center',
              color: 'var(--color-steel)',
              fontSize: '13px'
            }}>
              등록된 주보 이력이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {bulletins.map((bulletin) => (
                <div 
                  key={bulletin.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid var(--color-ash)',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    backgroundColor: 'var(--color-paper-white)',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bone)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-paper-white)'}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '70%' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-steel)' }}>
                      주일: {bulletin.date}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-graphite)' }}>
                      {bulletin.title}
                    </span>
                    {bulletin.fileName && (
                      <span style={{ fontSize: '11px', color: 'var(--color-steel)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        파일명: {bulletin.fileName}
                      </span>
                    )}
                    {bulletin.content && (
                      <span style={{ 
                        fontSize: '11px', 
                        color: 'var(--color-slate)', 
                        marginTop: '4px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.4',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {bulletin.content}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* 다운로드 / 열기 버튼 */}
                    {bulletin.fileUrl !== '#' && (
                      <a 
                        href={bulletin.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-indigo-ink)',
                          textDecoration: 'none',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        열기
                      </a>
                    )}
                    {/* 수정 버튼 */}
                    <button
                      onClick={() => handleOpenEdit(bulletin)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-indigo-ink)',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-medium)'
                      }}
                    >
                      수정
                    </button>
                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => handleDelete(bulletin.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d32f2f',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-medium)'
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 주보 수정 모달 */}
      {showEditModal && (
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
            maxWidth: '500px',
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
                주보 정보 수정
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
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
            <form onSubmit={handleUpdate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 날짜 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>주일 날짜</label>
                <input 
                  type="date" 
                  value={editingBulletin.date} 
                  onChange={(e) => setEditingBulletin({...editingBulletin, date: e.target.value})}
                  style={{
                    border: '1px solid var(--color-mist)',
                    borderRadius: 'var(--radius-inputs)',
                    padding: '8px 12px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* 제목 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>주보 제목</label>
                <input 
                  type="text" 
                  value={editingBulletin.title} 
                  onChange={(e) => setEditingBulletin({...editingBulletin, title: e.target.value})}
                  style={{
                    border: '1px solid var(--color-mist)',
                    borderRadius: 'var(--radius-inputs)',
                    padding: '8px 12px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* 내용 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>주보 텍스트 내용</label>
                <textarea 
                  value={editingBulletin.content} 
                  onChange={(e) => setEditingBulletin({...editingBulletin, content: e.target.value})}
                  rows="6"
                  style={{
                    border: '1px solid var(--color-mist)',
                    borderRadius: 'var(--radius-inputs)',
                    padding: '8px 12px',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              {/* 파일 변경 (선택) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-slate)' }}>
                  주보 파일 변경 (선택)
                </label>
                <input 
                  type="file" 
                  accept="application/pdf, image/*"
                  onChange={(e) => setEditFile(e.target.files[0])}
                  disabled={editUploading}
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-iron)',
                    cursor: editUploading ? 'not-allowed' : 'pointer'
                  }}
                />
                {editFile && (
                  <span style={{ fontSize: '11px', color: 'var(--color-violet-pulse)', fontWeight: 'var(--font-weight-medium)' }}>
                    선택된 새 파일: {editFile.name}
                  </span>
                )}
                {editUploading && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: 'var(--color-slate)' }}>새 파일 업로드 중...</span>
                      <span style={{ color: 'var(--color-violet-pulse)', fontWeight: 'bold' }}>{editProgress}%</span>
                    </div>
                    <div style={{
                      height: '5px',
                      backgroundColor: 'var(--color-fog)',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                      border: '1px solid var(--color-ash)'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${editProgress}%`,
                        backgroundColor: 'var(--color-violet-pulse)',
                        borderRadius: '9999px',
                        transition: 'width 0.1s linear'
                      }} />
                    </div>
                  </div>
                )}
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
                  onClick={() => !editUploading && setShowEditModal(false)}
                  disabled={editUploading}
                  style={{
                    backgroundColor: 'var(--color-paper-white)',
                    border: '1px solid var(--color-ash)',
                    borderRadius: 'var(--radius-buttons)',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: editUploading ? 'not-allowed' : 'pointer',
                    color: 'var(--color-graphite)',
                    boxShadow: 'var(--shadow-subtle-2)',
                    opacity: editUploading ? 0.6 : 1
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={editUploading}
                  style={{
                    backgroundColor: 'var(--color-violet-pulse)',
                    border: 'none',
                    borderRadius: 'var(--radius-buttons)',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: editUploading ? 'not-allowed' : 'pointer',
                    color: 'var(--color-paper-white)',
                    boxShadow: 'var(--shadow-sm)',
                    opacity: editUploading ? 0.6 : 1
                  }}
                >
                  {editUploading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
