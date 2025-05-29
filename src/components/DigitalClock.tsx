
"use client";

import React, { useState, useEffect } from 'react';

export default function DigitalClock() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time on client-side mount
    setCurrentTime(new Date());

    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) {
      return 'Loading...';
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
      <span className="font-tech text-lg text-primary glow-text">
        {formatTime(currentTime)}
      </span>
    </div>
  );
}
