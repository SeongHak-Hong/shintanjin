import { useEffect, useRef } from "react";

export const useMousePositionRef = () => {
  const positionRef = useRef({ 
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, 
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0 
  });

  useEffect(() => {
    const handleMouseMove = (ev) => {
      positionRef.current = { x: ev.clientX, y: ev.clientY };
    };

    const handleTouchMove = (ev) => {
      if (ev.touches.length > 0) {
        const touch = ev.touches[0];
        positionRef.current = { x: touch.clientX, y: touch.clientY };
      }
    };

    // Listen for both mouse and touch events
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return positionRef;
};
