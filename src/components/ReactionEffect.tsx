import React, { useEffect, useState } from 'react';

type ReactionType = 'pray' | 'people' | 'fire';

interface ReactionEffectProps {
  x: number;
  y: number;
  type: ReactionType;
  onComplete: () => void;
}

const ReactionEffect: React.FC<ReactionEffectProps> = ({ x, y, type, onComplete }) => {
  const [particles, setParticles] = useState<number[]>([1, 2, 3, 4, 5]);

  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const getIcon = () => {
    switch (type) {
      case 'pray': return '🙏';
      case 'people': return '🙌';
      case 'fire': return '🔥';
    }
  };

  return (
    <div 
      className="fixed pointer-events-none z-[9999]" 
      style={{ left: x, top: y }}
    >
      {particles.map((_, i) => (
        <span
          key={i}
          className="absolute animate-float-up opacity-0"
          style={{
            fontSize: `${Math.random() * 10 + 20}px`,
            left: `${(Math.random() - 0.5) * 40}px`,
            animationDelay: `${Math.random() * 0.2}s`,
            animationDuration: `${0.8 + Math.random() * 0.4}s`,
            transform: `translateX(${(Math.random() - 0.5) * 20}px)`
          }}
        >
          {getIcon()}
        </span>
      ))}
    </div>
  );
};

export default ReactionEffect;
