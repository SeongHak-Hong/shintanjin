import { useEffect } from 'react';

/**
 * 컴포넌트 마운트 시 HTML head에 <meta name="robots" content="noindex, nofollow"> 태그를 동적으로 삽입하고,
 * 컴포넌트 언마운트 시 해당 태그를 제거하는 커스텀 훅입니다.
 */
export default function useNoIndex() {
  useEffect(() => {
    // 이미 메타 태그가 있는지 확인
    let metaTag = document.querySelector('meta[name="robots"]');
    let created = false;

    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.name = 'robots';
      metaTag.content = 'noindex, nofollow';
      document.head.appendChild(metaTag);
      created = true;
    }

    return () => {
      // 컴포넌트가 언마운트될 때 동적으로 생성했던 메타 태그만 삭제
      if (created && metaTag && metaTag.parentNode) {
        metaTag.parentNode.removeChild(metaTag);
      }
    };
  }, []);
}
