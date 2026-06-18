import React from 'react';
import ControlButtons from './ControlButtons';

export default function VoiceVisualizer({ 
    status, 
    onMicToggle, 
    onEndSession, 
    onKeyboardInput 
}) {
    // Determine play state and speed of the waves
    const isRippleActive = status === 'RECORDING' || status === 'TRANSCRIBING' || status === 'THINKING';
    const playState = isRippleActive ? 'running' : 'paused';
    const duration = status === 'RECORDING' ? '2s' : '6s';

    // Instruction label changes depending on status
    const getInstructionText = () => {
        switch (status) {
            case 'RECORDING':
                return "말씀을 마치려면 버튼을 한 번 더 누르세요";
            case 'TRANSCRIBING':
                return "말씀하신 내용을 글자로 변환하고 있습니다";
            case 'THINKING':
                return "질문에 가장 좋은 답변을 생각하는 중입니다";
            case 'RESPONSE':
                return "여기를 누르면 새로운 질문을 하실 수 있습니다";
            default:
                return "여기를 누르고 말씀하세요";
        }
    };

    // Toggle button color active look during recording
    const micBtnStyle = status === 'RECORDING' ? {
        backgroundColor: 'var(--color-slate-blue)',
        borderColor: 'var(--color-lavender-wash)',
        boxShadow: '0 0 24px var(--color-slate-blue)'
    } : {};

    return (
        <div className="voice-dock">
            <div className="visualizer-container">
                {/* Dynamic ripples representing sound activity or processing progress */}
                <div className="water-ripple ripple-1" style={{ animationPlayState: playState, animationDuration: duration, animationDelay: '0s' }}></div>
                <div className="water-ripple ripple-2" style={{ animationPlayState: playState, animationDuration: duration, animationDelay: status === 'RECORDING' ? '0.5s' : '1.5s' }}></div>
                <div className="water-ripple ripple-3" style={{ animationPlayState: playState, animationDuration: duration, animationDelay: status === 'RECORDING' ? '1.0s' : '3.0s' }}></div>
                <div className="water-ripple ripple-4" style={{ animationPlayState: playState, animationDuration: duration, animationDelay: status === 'RECORDING' ? '1.5s' : '4.5s' }}></div>

                {/* Microphone button acting as toggle */}
                <button 
                    className="mic-btn" 
                    onClick={onMicToggle}
                    style={micBtnStyle}
                    aria-label="음성 녹음 시작 또는 완료"
                >
                    <svg viewBox="0 0 24 24">
                        {status === 'RECORDING' ? (
                            // Stop recording icon (Square)
                            <path d="M6 6h12v12H6z" />
                        ) : (
                            // Microphone icon
                            <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Instruction Microcopy */}
            <div className="mic-instruction">
                {getInstructionText()}
            </div>

            {/* Bottom Actions */}
            <ControlButtons 
                onEndSession={onEndSession} 
                onKeyboardInput={onKeyboardInput} 
            />
        </div>
    );
}
