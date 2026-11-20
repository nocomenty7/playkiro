export interface CustomPackQuestion {
  id: string;
  title: string;
  option_a: string;
  option_b: string;
}

export interface CustomPackQuestionStat {
  a: number;
  b: number;
}

export interface CustomPack {
  id: string;
  code: string;
  title: string;
  description: string;
  author_nickname: string;
  category: string;
  is_public: boolean;
  questions: CustomPackQuestion[];
  question_count: number;
  play_count: number;
  question_stats?: Record<string, CustomPackQuestionStat>;
  created_at: string;
  updated_at?: string;
}

export interface CustomPackSummary {
  id: string;
  code: string;
  title: string;
  description: string;
  author_nickname: string;
  category: string;
  is_public: boolean;
  question_count: number;
  play_count: number;
  preview_question: CustomPackQuestion | null;
  created_at: string;
}

export const MIN_PACK_QUESTIONS = 5;
export const MAX_PACK_QUESTIONS = 30;

export const PACK_CATEGORIES = [
  '자유',
  '스트리머/팬덤',
  '연인/커플',
  '친구/술자리',
  '음식/일상',
  '극한/상상',
] as const;

export type PackCategory = (typeof PACK_CATEGORIES)[number];

export const getPackCategoryBadgeClass = (category: string): string => {
  switch (category) {
    case '스트리머/팬덤':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
    case '연인/커플':
      return 'bg-pink-500/10 text-pink-400 border-pink-500/25';
    case '친구/술자리':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
    case '음식/일상':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
    case '극한/상상':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
    default:
      return 'bg-zinc-800/80 text-neutral-300 border-zinc-700/80';
  }
};

export const computeTotalVotesFromStats = (
  stats: Record<string, { a?: number; b?: number }> | null | undefined
): number => {
  if (!stats || typeof stats !== 'object') return 0;
  let sum = 0;
  for (const val of Object.values(stats)) {
    if (val && typeof val === 'object') {
      sum += (Number(val.a) || 0) + (Number(val.b) || 0);
    }
  }
  return sum;
};

export const formatPackDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  } catch {
    return '';
  }
};
