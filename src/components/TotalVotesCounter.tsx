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
          
          // Subtract a much smaller random number so a refresh isn't obvious
          const initialOffset = Math.floor(Math.random() * 3) + 2; // 2 to 4
          
          if (actualTotal > initialOffset) {
            totalRef.current = actualTotal - initialOffset;
          } else {
            totalRef.current = actualTotal;
          }
          
          setTotal(totalRef.current);

          // Start the fake real-time counter (slower and more natural)
          const updateCounter = () => {
            // Mostly increment by 1, rarely by 2
            const increment = Math.random() > 0.85 ? 2 : 1;
            totalRef.current += increment;
            setTotal(totalRef.current);
            
            // Random interval between 3s (3000ms) and 9s (9000ms) for a slow, natural feel
            const nextInterval = Math.floor(Math.random() * 6000) + 3000;
            timerId = setTimeout(updateCounter, nextInterval);
          };

          // Start after a random delay (1s to 4s)
          timerId = setTimeout(updateCounter, Math.floor(Math.random() * 3000) + 1000);
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
      className="flex items-center justify-center gap-2 mb-3 -mt-2"
    >
      <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.15)]">
        <Users className="w-3.5 h-3.5" />
        <span className="text-xs font-black tracking-wide">누적 투표수</span>
      </div>
      <div className="font-mono text-lg font-black text-white tracking-wider flex items-center">
        {total.toLocaleString()}
      </div>
    </motion.div>
  );
}
