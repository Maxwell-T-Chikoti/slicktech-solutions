'use client';

import React, { useEffect, useState } from 'react';

interface CounterProps {
  from: number;
  to: number;
  duration?: number;
  suffix?: string;
}

const Counter = ({ from, to, duration = 2000, suffix = '' }: CounterProps) => {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let startTime: number;
    let animationId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(from + (to - from) * progress));

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [from, to, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

export default Counter;