'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function TotalVotesCounter() {
  const [total, setTotal] = useState<number | null>(null);
  const totalRef = useRef<number>(0);

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const fetchInitialTotal = async () => {
      try {
        const res = await fetch('/api/stats/total-votes');
        if (res.ok) {
          const data = await res.json();
          const actualTotal = data.total || 0;
          
          if (actualTotal > 30) {
            totalRef.current = actualTotal - 30;
          } else {
            totalRef.current = actualTotal;
          }
          
          setTotal(totalRef.current);

          // Start the fake real-time counter
          const updateCounter = () => {
            const increment = Math.floor(Math.random() * 3) + 1; // 1 to 3
            totalRef.current += increment;
            setTotal(totalRef.current);
            
            // Random interval between 200ms and 1500ms for natural feel
            const nextInterval = Math.floor(Math.random() * 1300) + 200;
            timerId = setTimeout(updateCounter, nextInterval);
          };

          timerId = setTimeout(updateCounter, 1000); // start after 1s
        }
      } catch (err) {
        console.error('Failed to fetch total votes', err);
      }
    };

    fetchInitialTotal();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  if (total === null) {
    return <div className="h-6"></div>; // placeholder to prevent layout shift
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-2 mb-3"
    >
      <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
        <Users className="w-3.5 h-3.5" />
        <span className="text-xs font-black tracking-wide">누적 참여 횟수</span>
      </div>
      <div className="font-mono text-lg font-black text-white tracking-wider flex items-center">
        {total.toLocaleString()}
      </div>
    </motion.div>
  );
}
