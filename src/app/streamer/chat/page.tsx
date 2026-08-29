import React, { Suspense } from 'react';
import ChatStreamerGameClient from '../../../components/ChatStreamerGameClient';

export default function ChatStreamerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080911]" />}>
      <ChatStreamerGameClient />
    </Suspense>
  );
}
