import React from 'react';
import { supabase } from '@/lib/supabase';
import VoteClient from '@/components/VoteClient';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const dynamic = 'force-dynamic';

export default async function PlayPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q as string | undefined;

  let question = null;
  let initialVotesA = 0;
  let initialVotesB = 0;
  let allQuestionsList: { id: string; question_no: number; category: string | null }[] = [];
  let errorMsg: string | null = null;

  try {
    // 1. Fetch all available question IDs, question_no, and categories for client filtering and navigation
    const { data: allQuestions, error: allError } = await supabase
      .from('questions')
      .select('id, question_no, category')
      .order('question_no', { ascending: true });
    
    if (allError) {
      errorMsg = `질문 목록 로드 실패: ${allError.message} (코드: ${allError.code})`;
      console.error('Error fetching questions list:', allError);
    } else if (allQuestions) {
      allQuestionsList = allQuestions;
    }

    // 2. If a query value is provided, load details and statistics
    if (q && !errorMsg) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
      
      let query = supabase.from('questions').select('*');
      if (isUuid) {
        query = query.eq('id', q);
      } else {
        const num = parseInt(q, 10);
        query = query.eq('question_no', isNaN(num) ? -1 : num);
      }

      const { data: fetchedQuestion, error: qError } = await query.maybeSingle();

      if (qError) {
        errorMsg = `개별 질문 로드 실패 (?q=${q}): ${qError.message} (코드: ${qError.code})`;
        console.error('Error fetching specific question:', qError);
      } else if (fetchedQuestion) {
        question = fetchedQuestion;

        // Baseline initial votes from the questions table
        initialVotesA = Number(fetchedQuestion.votes_a) || 0;
        initialVotesB = Number(fetchedQuestion.votes_b) || 0;

        // Fetch pre-aggregated vote statistics from vote_stats
        const { data: statsData, error: statsError } = await supabase
          .from('vote_stats')
          .select('stats')
          .eq('question_id', fetchedQuestion.id)
          .maybeSingle();

        if (statsError) {
          console.error('Error fetching vote stats:', statsError);
        } else if (statsData && statsData.stats) {
          let statsA = 0;
          let statsB = 0;
          const stats = statsData.stats as Record<string, number>;
          Object.keys(stats).forEach((key) => {
            const val = Number(stats[key]) || 0;
            if (key.endsWith('_a')) {
              statsA += val;
            } else if (key.endsWith('_b')) {
              statsB += val;
            }
          });

          initialVotesA = Math.max(initialVotesA, statsA);
          initialVotesB = Math.max(initialVotesB, statsB);
        }
      }
    }
  } catch (err: any) {
    errorMsg = `서버 데이터 페치 중 치명적 에러: ${err?.message || err}`;
    console.error('Fatal server side error:', err);
  }

  return (
    <VoteClient
      key={question?.id || 'empty'}
      question={question}
      initialVotesA={initialVotesA}
      initialVotesB={initialVotesB}
      allQuestions={allQuestionsList}
      serverError={errorMsg}
    />
  );
}
