"use client";

import { useEffect, useState } from "react";

type CountUpType = {
  end: number;
  duration?: number;
  suffix?: string;
};

export const CountUp = ({ end, duration = 2000, suffix = "" }: CountUpType) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(progress * end * 10) / 10;
      setDisplay(value);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <div className="text-5xl font-light tracking-tighter mb-4">
      {display}
      {suffix}
    </div>
  );
};
