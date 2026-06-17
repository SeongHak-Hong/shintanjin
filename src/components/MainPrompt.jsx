import React from 'react';

export default function MainPrompt({ status, promptText, secondaryText, responseContent }) {
    const renderTextWithBreaks = (text) => {
        if (!text) return '';
        return text.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                {index < text.split('\n').length - 1 && <br />}
            </React.Fragment>
        ));
    };

    if (status === 'RESPONSE') {
        return (
            <main className="center-stage">
                <h1 className="primary-prompt" style={{ fontSize: 'var(--text-heading-sm)', marginBottom: 'var(--spacing-8)' }}>
                    답변을 준비해 보았어요
                </h1>
                
                {/* 어르신 전용 고대비 대형 스크롤 컨테이너 */}
                <div className="response-scroll-area">
                    <div className="response-text">
                        {responseContent}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="center-stage">
            {/* Setting key={promptText} triggers remount to play textReveal CSS animation */}
            <h1 key={promptText} className="primary-prompt">
                {renderTextWithBreaks(promptText)}
            </h1>
            <p key={secondaryText} className="secondary-context">
                {secondaryText}
            </p>
        </main>
    );
}
