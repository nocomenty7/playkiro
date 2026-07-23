import React from 'react';
import StreamerGameClient from '@/components/StreamerGameClient';

interface PageProps {
  params: Promise<{
    pin: string;
  }>;
  searchParams: Promise<{
    nickname?: string;
    overlay?: string;
  }>;
}

export default async function StreamerRoomPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <StreamerGameClient
      pin={resolvedParams.pin}
      viewerNickname={resolvedSearchParams.nickname}
      isOverlay={resolvedSearchParams.overlay === 'true'}
    />
  );
}
