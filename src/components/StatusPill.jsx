import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_MAIN } from '../constants/routes';

const STATUS_CONFIG = {
    IDLE: {
        text: "대기 중",
        color: "var(--color-steel)"
    },
    RECORDING: {
        text: "말씀해 주세요...",
        color: "var(--color-violet-pulse)"
    },
    TRANSCRIBING: {
        text: "음성을 글자로 바꾸는 중...",
        color: "var(--color-indigo-ink)"
    },
    THINKING: {
        text: "답변을 생각하는 중...",
        color: "var(--color-indigo-ink)"
    },
    RESPONSE: {
        text: "답변이 도착했습니다",
        color: "var(--color-ledger-green)"
    }
};

export default function StatusPill({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.IDLE;
    const navigate = useNavigate();

    return (
        <header className="header">
            <button 
                className="chatbot-home-btn" 
                onClick={() => navigate(ROUTE_MAIN)}
                title="처음으로 돌아가기"
            >
                <svg viewBox="0 0 24 24">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                처음으로
            </button>
            <div className="status-pill">
                <div 
                    className="status-dot" 
                    style={{ 
                        backgroundColor: config.color,
                        boxShadow: `0 0 12px ${config.color}`
                    }}
                ></div>
                <span className="status-text">{config.text}</span>
            </div>
        </header>
    );
}

