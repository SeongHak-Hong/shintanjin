import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// 사이트 첫 진입 여부를 추적하는 전역 변수
let isFirstLoad = true;

export default function PageTransition({ children }) {
  const [isInitial] = useState(isFirstLoad);

  useEffect(() => {
    if (isFirstLoad) {
      isFirstLoad = false;
    }
  }, []);

  const pageContentVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.8,
        // 빛이 중앙에서 터지고 팽창하여 화면을 덮는 시점(약 0.9초) 이후에 콘텐츠 등장
        delay: isInitial ? 0.9 : 0.1,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.4, ease: 'easeIn' }
    }
  };

  const overlayVariants = {
    initial: { opacity: 1 },
    animate: {
      opacity: 0,
      transition: {
        duration: 1.0,
        delay: isInitial ? 0.8 : 0,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 1,
      transition: { duration: 0.6, ease: "easeInOut" }
    }
  };

  // 핵심 개선 포인트: '중앙에서 퍼져나가는 폭발력' 극대화
  // 1. POP (0~10% 구간): opacity가 즉시 1로 켜지면서 중앙에 작은 빛(scale 1.5) 응집 (easeOut)
  // 2. SHOOOM (10~40% 구간): 응집된 빛이 기하급수적(circIn)으로 팽창하며 화면을 강하게 덮음
  // 3. FADE (40~100% 구간):  // Blob 1: Lavender Wash (#d3e7ff) from Hero Section
  const blob1Variants = {
    initial: {
      scale: isInitial ? 0 : 2,
      rotate: 0,
      opacity: isInitial ? 0 : 1
    },
    animate: {
      scale: isInitial ? [0, 0.5, 2, 2] : 2,
      rotate: isInitial ? [0, 10, 45, 45] : 45,
      opacity: isInitial ? [0, 1, 1, 0] : 0,
      transition: {
        duration: isInitial ? 2.2 : 1.2,
        times: isInitial ? [0, 0.1, 0.4, 1] : undefined,
        ease: isInitial ? ['easeOut', 'circIn', 'easeOut'] : 'easeOut'
      }
    },
    exit: {
      scale: [0, 0.5, 2],
      rotate: [0, 15, 60],
      opacity: [0, 1, 1],
      transition: {
        duration: 0.9,
        times: [0, 0.2, 1],
        ease: ['easeOut', 'circIn']
      }
    }
  };

  // Blob 2: Pure White (#ffffff) core
  const blob2Variants = {
    initial: {
      scale: isInitial ? 0 : 2,
      rotate: 0,
      opacity: isInitial ? 0 : 1
    },
    animate: {
      scale: isInitial ? [0, 0.5, 2, 2] : 2,
      rotate: isInitial ? [0, -10, -30, -30] : -30,
      opacity: isInitial ? [0, 1, 1, 0] : 0,
      transition: {
        duration: isInitial ? 2.0 : 1.0,
        delay: isInitial ? 0.05 : 0.1,
        times: isInitial ? [0, 0.1, 0.4, 1] : undefined,
        ease: isInitial ? ['easeOut', 'circIn', 'easeOut'] : 'easeOut'
      }
    },
    exit: {
      scale: [0, 0.5, 2],
      rotate: [0, -15, -45],
      opacity: [0, 1, 1],
      transition: {
        duration: 0.85,
        delay: 0.05,
        times: [0, 0.2, 1],
        ease: ['easeOut', 'circIn']
      }
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f1f0eb' }}
    >
      <motion.div variants={pageContentVariants}>
        {children}
      </motion.div>

      <div
        className="sbc-spreading-light"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          pointerEvents: 'none',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <motion.div
          variants={overlayVariants}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#f1f0eb',
          }}
        />

        {/* Organic Blob 1: Pale Blue (Lavender Wash) -> Safari의 회색 테두리 그라데이션 렌더링 버그를 피하기 위해 Mask-image 사용 */}
        <motion.div variants={blob1Variants} style={{
          position: 'absolute',
          width: '150vw',
          height: '150vw',
          backgroundColor: '#d3e7ff', // PC에서 예뻤던 본래 색상 완벽 복원
          WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0) 65%)',
          maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0) 65%)',
          willChange: 'transform, opacity'
        }} />

        {/* Organic Blob 2: White Core */}
        <motion.div variants={blob2Variants} style={{
          position: 'absolute',
          width: '120vw',
          height: '120vw',
          backgroundColor: '#ffffff',
          WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0) 65%)',
          maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0) 65%)',
          willChange: 'transform, opacity'
        }} />

      </div>
    </motion.div>
  );
}
