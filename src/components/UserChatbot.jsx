import React, { useState, useEffect, useRef } from 'react';
import VisualizerCanvas from './VisualizerCanvas';
import StatusPill from './StatusPill';
import MainPrompt from './MainPrompt';
import VoiceVisualizer from './VoiceVisualizer';
import PageTransition from './PageTransition';

// 사용자에게 질문을 유도하는 주보/소식 관련 롤링 안내 문구
const IDLE_PROMPTS = [
    "이번 주 예배 시간을\n알려드릴까요?",
    "오늘 주일 교회 소식을\n들려드릴까요?",
    "이번 주 성경 말씀 구절을\n찾아드릴까요?",
    "예배 후에 무슨 행사가 있는지\n읽어드릴까요?"
];

// 교회 고정 컨텍스트 (Gemini 프롬프트에 활용되어 정확한 안내 유도)
const CHURCH_BULLETIN_CONTEXT = `
[교회 주보 및 소식 정보]
- 주일 예배 시간: 1부 오전 9시, 2부 오전 11시 (대예배실)
- 수요 기도회: 매주 수요일 오후 7시 30분 (소예배실)
- 금요 철야 기도회: 매주 금요일 오후 9시 (대예배실)
- 새벽 기도회: 월요일부터 토요일까지 매일 오전 5시 30분 (새벽예배실)
- 이번 주 교회 소식:
  1. 이번 주 일요일은 설립 20주년 기념 감사 예배로 함께 드립니다. 예배 및 점심 식사 종료 후 친교실에서 기념 떡 나눔 행사가 진행됩니다.
  2. 여름 성경학교를 섬겨주실 교사 모집이 진행 중입니다. 교육관 1층 로비 신청대에서 이름과 연락처를 남겨주세요.
  3. 다음 주 화요일부터 바둑 교실 및 서예 교실이 대예배실 앞 문화센터실에서 개강합니다. 접수는 행정실에서 가능하오니 많은 참여를 바랍니다.
- 이번 주 성경 봉독 구절: 데살로니가전서 5장 16절부터 18절 말씀 ("항상 기뻐하라, 쉬지 말고 기도하라, 범사에 감사하라. 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라")
`;

export default function UserChatbot() {
    // 5단계 상태 머신: IDLE, RECORDING, TRANSCRIBING, THINKING, RESPONSE
    const [status, setStatus] = useState('IDLE');
    const [promptIndex, setPromptIndex] = useState(0);
    const [transcribedText, setTranscribedText] = useState("");
    const [responseContent, setResponseContent] = useState("");
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [keyboardInputValue, setKeyboardInputValue] = useState("");
    
    // 오디오 레코딩 관리 레퍼런스
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    // API 키 구성 (Vite 환경 변수 참조)
    const STT_KEY = import.meta.env.VITE_GOOGLE_STT_KEY || "";
    const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

    // 데모 시뮬레이션 모드 여부 판정 (실제 키가 빈칸이거나 템플릿 기본값일 때 자동 작동)
    const isSimulated = !STT_KEY || !GEMINI_KEY || 
                        STT_KEY.includes("ApiKeyHere") || 
                        GEMINI_KEY.includes("ApiKeyHere");

    // 0. 챗봇 진입 시 스크롤 비활성화 (메인 랜딩 페이지 스크롤 영향 최소화)
    useEffect(() => {
        document.body.classList.add('no-scroll');
        return () => {
            document.body.classList.remove('no-scroll');
        };
    }, []);

    // 1. IDLE 상태일 때 도움 롤링 문구 주기적 회전 (7초 간격)
    useEffect(() => {
        if (status !== 'IDLE') return;

        const timer = setInterval(() => {
            setPromptIndex(prev => (prev + 1) % IDLE_PROMPTS.length);
        }, 7000);

        return () => clearInterval(timer);
    }, [status]);

    // 2. 오디오 Blob을 Base64로 인코딩하는 유틸리티
    const encodeAudioToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result.split(',')[1];
                resolve(base64data);
            };
            reader.onerror = reject;
        });
    };

    // 3. 녹음 시작 함수
    const startRecording = async () => {
        audioChunksRef.current = [];
        setTranscribedText("");
        setResponseContent("");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            // 브라우저 호환성을 위한 오디오 마임타입 설정
            let options = { mimeType: 'audio/webm' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'audio/ogg' };
            }
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = {}; // 브라우저 디폴트
            }

            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
                // 모든 마이크 트랙 정지하여 하드웨어 비활성화
                stream.getTracks().forEach(track => track.stop());
                
                // 녹음 정지와 함께 바로 텍스트 변환 상태로 전이
                setStatus('TRANSCRIBING');
                processSpeechRecognition(audioBlob);
            };

            mediaRecorder.start();
            setStatus('RECORDING');
        } catch (err) {
            console.error("마이크 접근에 실패했습니다: ", err);
            alert("마이크 사용 권한을 허용해 주셔야 음성 대화가 가능합니다.");
            setStatus('IDLE');
        }
    };

    // 4. 녹음 완료 함수
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    // 5. 구글 Speech-to-Text API 연동
    const processSpeechRecognition = async (audioBlob) => {
        if (isSimulated) {
            // 데모 모드 시뮬레이션
            setTimeout(() => {
                const mockQuestions = [
                    "이번 주 예배 소식 알려줘",
                    "바둑 교실 언제 시작해?",
                    "이번 주 예배 시간이 어떻게 되나요?",
                    "설교 성경 구절 찾아줘"
                ];
                const selectedQuestion = mockQuestions[Math.floor(Math.random() * mockQuestions.length)];
                setTranscribedText(selectedQuestion);
                setStatus('THINKING');
                generateChatbotResponse(selectedQuestion);
            }, 2500);
            return;
        }

        try {
            const base64Audio = await encodeAudioToBase64(audioBlob);
            
            const payload = {
                config: {
                    encoding: "WEBM_OPUS",
                    sampleRateHertz: 48000,
                    languageCode: "ko-KR"
                },
                audio: {
                    content: base64Audio
                }
            };

            const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${STT_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            
            if (data.results && data.results[0] && data.results[0].alternatives[0]) {
                const queryText = data.results[0].alternatives[0].transcript;
                setTranscribedText(queryText);
                setStatus('THINKING');
                generateChatbotResponse(queryText);
            } else {
                throw new Error("음성 변환 결과가 없거나 소리가 감지되지 않았습니다.");
            }
        } catch (error) {
            console.error("STT API 에러: ", error);
            alert("음성을 선명하게 알아듣지 못했습니다. 다시 말씀해 주시겠어요?");
            setStatus('IDLE');
        }
    };

    // 6. Gemini API (Google AI Studio) 연동
    const generateChatbotResponse = async (question) => {
        const systemPrompt = `당신은 교회를 방문하거나 이용하는 분들을 친절하게 안내하는 교회 AI 도우미 비서입니다.
사용자는 교회의 성도일 수도 있고, 교회에 다니지 않는 분일 수도 있습니다. 따라서 특정 대상을 지칭하는 호칭('어르신', '성도님' 등)은 절대 사용하지 마시고, 모든 분들에게 정중하고 친근하게 존댓말로 답변해 주세요.
돋보기 없이도 답변을 편하게 읽으실 수 있도록 아래 지침을 반드시 철저하게 지켜 답변해 주세요.

[답변 작성 기본 지침]
1. 반드시 존댓말로 대답하십시오. (~드려요, ~했습니다, ~있답니다 등 친근하고 정중한 어조)
2. 글자 크기가 화면에 매우 크게 표시되므로, 한 문장은 짧고 간결하게 작성하고 줄바꿈을 자주 해 주십시오.
3. 어려운 교회 행정 용어는 설명글을 덧붙이거나 쉬운 단어로 풀어 쓰십시오.
4. 아래에 제공되는 [교회 주보 및 소식 정보] 안의 내용만을 바탕으로 정직하게 설명해야 하며, 주보에 나와있지 않은 사실이나 지어낸 정보(날짜, 시간, 연락처 등)를 절대 추가로 제공하지 마십시오.

${CHURCH_BULLETIN_CONTEXT}

사용자가 질문하신 내용: "${question}"`;

        if (isSimulated) {
            // 데모 모드 시뮬레이션
            setTimeout(() => {
                let answer = "";
                if (question.includes("예배 시간")) {
                    answer = `예배 시간은 아래와 같아요.\n\n` +
                             `♥ 주일 대예배\n` +
                             `- 1부: 오전 9시\n` +
                             `- 2부: 오전 11시\n` +
                             `두 예배 모두 본당 대예배실에서 드립니다.\n\n` +
                             `♥ 기도회 모임\n` +
                             `- 수요 기도회: 수요일 오후 7시 30분\n` +
                             `- 금요 철야 기도: 금요일 오후 9시\n` +
                             `- 매일 새벽 기도: 월~토 오전 5시 30분\n\n` +
                             `편하실 때 오셔서 은혜 넘치는 예배 드리세요.`;
                } else if (question.includes("바둑") || question.includes("서예")) {
                    answer = `문화학교 소식이에요!\n\n` +
                             `♥ 바둑 및 서예 교실 개강\n` +
                             `- 시작 날짜: 다음 주 화요일부터\n` +
                             `- 교육 장소: 대예배실 앞 문화센터실\n\n` +
                             `참가를 원하시면 1층 행정실에 오셔서 신청서를 적어 주시면 된답니다.\n\n` +
                             `접수가 마감되기 전에 편하게 가셔서 신청해 보세요!`;
                } else if (question.includes("성경") || question.includes("구절")) {
                    answer = `이번 주 예배 시간에 함께 읽은 하나님의 귀한 성경 말씀이에요.\n\n` +
                             `♥ 데살로니가전서 5장 16절~18절\n\n` +
                             `"항상 기뻐하라\n` +
                             `쉬지 말고 기도하라\n` +
                             `범사에 감사하라\n\n` +
                             `이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라"\n\n` +
                             `마음에 품고 한 주 동안 평안하고 행복하시기를 기도합니다.`;
                } else {
                    answer = `이번 주 교회 소식을 들려드릴게요.\n\n` +
                             `♥ 교회 설립 20주년 기념 감사 예배\n` +
                             `이번 주 일요일은 우리 교회가 세워진 지 20주년이 되는 감사한 날입니다.\n\n` +
                             `정성껏 준비한 감사 예배를 드리고, 예배와 점심 식사를 마친 뒤에 친교실로 오시면 맛있는 기념 떡을 나누어 드립니다.\n\n` +
                             `꼭 떡을 받아 가셔서 즐겁게 교제 나누셔요!`;
                }
                setResponseContent(answer);
                setStatus('RESPONSE');
            }, 2500);
            return;
        }

        try {
            const payload = {
                contents: [{
                    parts: [{
                        text: systemPrompt
                    }]
                }]
            };

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Gemini API HTTP 에러 응답:", errText);
                throw new Error(`HTTP ${response.status}: ${errText}`);
            }

            const data = await response.json();
            console.log("Gemini API 정상 응답 데이터:", data);
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                const answerText = data.candidates[0].content.parts[0].text;
                setResponseContent(answerText);
                setStatus('RESPONSE');
            } else {
                console.error("Gemini 응답 구조 예외:", data);
                throw new Error(`응답 구조 예외: ${JSON.stringify(data)}`);
            }
        } catch (error) {
            console.error("Gemini API 에러 상세: ", error);
            setResponseContent(`죄송합니다, 답변을 가져오는 과정에 문제가 발생했습니다.\n\n[오류 상세 정보]\n${error.message}\n\n인터넷 연결을 확인하시거나 관리자에게 문의해 주세요.`);
            setStatus('RESPONSE');
        }
    };

    // 마이크 버튼 클릭 조작부
    const handleMicToggle = () => {
        if (status === 'IDLE' || status === 'RESPONSE') {
            startRecording();
        } else if (status === 'RECORDING') {
            stopRecording();
        }
    };

    // 대화 종료 핸들러
    const handleEndSession = () => {
        setStatus('IDLE');
        setTranscribedText("");
        setResponseContent("");
        setPromptIndex(0);
    };

    // 키보드 직접 텍스트 입력 핸들러 (텍스트 입력 모달 창 활성화)
    const handleKeyboardInput = () => {
        setKeyboardInputValue("");
        setIsKeyboardOpen(true);
    };

    const handleKeyboardSubmit = () => {
        if (keyboardInputValue && keyboardInputValue.trim() !== "") {
            const query = keyboardInputValue.trim();
            setTranscribedText(query);
            setIsKeyboardOpen(false);
            setStatus('THINKING');
            generateChatbotResponse(query);
        }
    };

    // 상태에 따른 화면 안내 텍스트 조절
    const getDisplayPrompt = () => {
        switch (status) {
            case 'RECORDING':
                return "말씀을 귀 기울여\n듣고 있습니다";
            case 'TRANSCRIBING':
                return "말씀하신 소리를\n텍스트로 변환 중입니다";
            case 'THINKING':
                return `"${transcribedText}"\n\n이 질문에 맞는 주보 내용을\n열심히 찾는 중입니다...`;
            case 'RESPONSE':
                return ""; // RESPONSE 뷰에서는 MainPrompt에서 스크롤 뷰가 직접 그려짐
            default:
                return IDLE_PROMPTS[promptIndex];
        }
    };

    const displayPrompt = getDisplayPrompt();
    const secondaryText = status === 'RECORDING' 
        ? "말씀이 끝나시면 아래 둥근 정지 단추를 한 번 더 눌러주세요." 
        : "교회 주보, 소식, 성경 구절 등을 알려드릴 수 있습니다.";

    return (
        <PageTransition backgroundColor="var(--color-obsidian)">
            {/* 부드러운 웜 바이올렛 radial wash 셰이더 배경 */}
            <VisualizerCanvas />

            {/* 로컬 개발용 시뮬레이터 안내 배너 */}
            {isSimulated && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    width: '100%',
                    background: 'var(--color-marble)',
                    color: 'var(--color-graphite)',
                    textAlign: 'center',
                    padding: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    zIndex: 999,
                    borderBottom: '1px solid var(--color-ash)'
                }}>
                    💡 최상위 폴더의 .env 파일에 구글 STT/제미나이 키가 없으므로 데모 시뮬레이션 모드로 실행됩니다.
                </div>
            )}

            <div className="ui-layer" style={{ paddingTop: isSimulated ? '40px' : 'var(--safe-top)' }}>
                {/* 상단 현재 상태 필 */}
                <StatusPill status={status} />

                {/* 중앙 텍스트 안내 및 큰 폰트 스크롤 답변 패널 */}
                <MainPrompt 
                    status={status}
                    promptText={displayPrompt}
                    secondaryText={secondaryText}
                    responseContent={responseContent}
                />

                {/* 하단 마이크 토글 버튼 및 보조 종료/키보드 버튼 */}
                <VoiceVisualizer 
                    status={status}
                    onMicToggle={handleMicToggle}
                    onEndSession={handleEndSession}
                    onKeyboardInput={handleKeyboardInput}
                />
            </div>

            {/* 텍스트 입력 전체화면 모달 */}
            {isKeyboardOpen && (
                <div className="keyboard-modal-overlay">
                    <div className="keyboard-modal">
                        <button 
                            className="modal-close-btn" 
                            onClick={() => setIsKeyboardOpen(false)}
                            aria-label="닫기"
                        >
                            &times;
                        </button>
                        <h2 className="modal-title">질문 직접 입력하기</h2>
                        <p className="modal-subtitle">알고 싶으신 내용을 손으로 입력해 주세요.</p>
                        <input 
                            type="text" 
                            className="modal-input" 
                            value={keyboardInputValue} 
                            onChange={(e) => setKeyboardInputValue(e.target.value)}
                            placeholder="예: 이번 주 예배 시간을 알려줘"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleKeyboardSubmit();
                                }
                            }}
                        />
                        <button 
                            className="modal-submit-btn" 
                            onClick={handleKeyboardSubmit}
                        >
                            답변 받기
                        </button>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
