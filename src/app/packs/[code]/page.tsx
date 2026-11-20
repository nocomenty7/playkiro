import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import PackDetailClient from '@/components/PackDetailClient';
import type { CustomPack } from '@/lib/customPacks';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ code: string }>;
}

async function fetchPackByCode(code: string): Promise<CustomPack | null> {
  const { data, error } = await supabase
    .from('custom_packs')
    .select(
      'id, code, title, description, author_nickname, category, is_public, questions, question_count, play_count, created_at, updated_at'
    )
    .eq('code', code)
    .maybeSingle();

  if (error || !data) return null;
  return data as CustomPack;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const pack = await fetchPackByCode(code);

  if (!pack) {
    return {
      title: '기로 팩을 찾을 수 없습니다 | 기로(PlayKiro)',
    };
  }

  const desc =
    pack.description ||
    `${pack.author_nickname}님이 만든 ${pack.question_count}문제 밸런스게임 팩! 혼자 풀거나 스트리머 채팅연동·방만들기로 함께 즐겨보세요.`;

  return {
    title: `${pack.title} | 나만의 기로 팩`,
    description: desc,
    openGraph: {
      title: `${pack.title} (${pack.question_count}문제) | 기로`,
      description: desc,
      type: 'website',
    },
  };
}

export default async function PackDetailPage({ params }: PageProps) {
  const { code } = await params;
  const pack = await fetchPackByCode(code);

  if (!pack) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-[#080911] text-white p-6 text-center space-y-4">
        <div className="text-4xl">🧐</div>
        <h1 className="text-xl font-black text-neutral-100">존재하지 않거나 삭제된 기로 팩이에요</h1>
        <p className="text-xs text-neutral-400">링크가 올바른지 확인하거나 다른 공개 기로 팩을 둘러보세요.</p>
        <div className="flex items-center gap-2 pt-2">
          <Link
            href="/packs"
            className="px-5 py-3 rounded-xl bg-brand-yellow text-zinc-950 font-black text-xs hover:bg-[#e0b240] transition"
          >
            공개 팩 목록 보기
          </Link>
          <Link
            href="/"
            className="px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-neutral-200 font-bold text-xs hover:bg-zinc-800 transition"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return <PackDetailClient pack={pack} />;
}
