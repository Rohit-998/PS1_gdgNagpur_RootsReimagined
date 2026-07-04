'use client';
import { useEffect, useRef, useState } from 'react';

export default function ParticleGrid() {
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current && containerRef.current.parentElement) {
        const rect = containerRef.current.parentElement.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const handleMouseLeave = () => {
      setMousePosition({ x: -1000, y: -1000 });
    };

    const container = containerRef.current?.parentElement;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  return (
    <>
      {/* Base faint dot grid */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Interactive brighter dot grid that follows mouse */}
      <div 
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.35) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          WebkitMaskImage: `radial-gradient(circle 250px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 100%)`,
          maskImage: `radial-gradient(circle 250px at ${mousePosition.x}px ${mousePosition.y}px, black 0%, transparent 100%)`,
          transition: 'mask-image 0.1s ease-out, -webkit-mask-image 0.1s ease-out'
        }}
      />
    </>
  );
}
