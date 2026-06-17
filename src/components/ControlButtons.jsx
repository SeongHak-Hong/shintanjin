import React from 'react';

export default function ControlButtons({ onEndSession, onKeyboardInput }) {
    return (
        <div className="secondary-controls">
            {/* 종료 버튼 */}
            <div className="control-item" onClick={onEndSession}>
                <svg viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                </svg>
                <span className="control-label">종료</span>
            </div>

            {/* 키보드 입력 버튼 */}
            <div className="control-item" onClick={onKeyboardInput}>
                <svg viewBox="0 0 24 24">
                    <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z" />
                </svg>
                <span className="control-label">키보드 입력</span>
            </div>
        </div>
    );
}
