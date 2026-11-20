import crypto from 'node:crypto';
import {
  CustomPackQuestion,
  MAX_PACK_QUESTIONS,
  MIN_PACK_QUESTIONS,
  PACK_CATEGORIES,
} from './customPacks';

const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

export function generatePackCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

export function hashPackPassword(code: string, password: string): string {
  return crypto
    .createHash('sha256')
    .update(`kiro_pack_v1:${code}:${password}`)
    .digest('hex');
}

export function verifyPackPassword(code: string, password: string, storedHash: string): boolean {
  const incoming = hashPackPassword(code, password);
  const a = Buffer.from(incoming, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export interface ValidatedPackPayload {
  title: string;
  description: string;
  author_nickname: string;
  category: string;
  is_public: boolean;
  questions: CustomPackQuestion[];
}

export function validatePackPayload(
  body: any,
  options: { requirePassword?: boolean } = { requirePassword: true }
): { ok: true; data: ValidatedPackPayload; password?: string } | { ok: false; error: string } {
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const description = typeof body?.description === 'string' ? body.description.trim() : '';
  const authorNickname = typeof body?.author_nickname === 'string' ? body.author_nickname.trim() : '';
  const rawCategory = typeof body?.category === 'string' ? body.category.trim() : '자유';
  const category = (PACK_CATEGORIES as readonly string[]).includes(rawCategory) ? rawCategory : '자유';
  const isPublic = body?.is_public !== false;
  const password = typeof body?.password === 'string' ? body.password.trim() : '';

  if (title.length < 2 || title.length > 60) {
    return { ok: false, error: '팩 제목은 2자 이상 60자 이내로 입력해 주세요.' };
  }

  if (description.length > 200) {
    return { ok: false, error: '한 줄 소개는 200자 이내로 입력해 주세요.' };
  }

  if (authorNickname.length < 1 || authorNickname.length > 20) {
    return { ok: false, error: '제작자 닉네임은 1자 이상 20자 이내로 입력해 주세요.' };
  }

  if (options.requirePassword && !/^\d{4}$/.test(password)) {
    return { ok: false, error: '수정/삭제용 비밀번호는 숫자 4자리로 입력해 주세요.' };
  }

  if (!Array.isArray(body?.questions)) {
    return { ok: false, error: '질문 목록 형식이 올바르지 않습니다.' };
  }

  if (body.questions.length < MIN_PACK_QUESTIONS || body.questions.length > MAX_PACK_QUESTIONS) {
    return {
      ok: false,
      error: `질문은 최소 ${MIN_PACK_QUESTIONS}개 이상, 최대 ${MAX_PACK_QUESTIONS}개 이하로 작성해 주세요.`,
    };
  }

  const sanitizedQuestions: CustomPackQuestion[] = [];
  for (let i = 0; i < body.questions.length; i++) {
    const q = body.questions[i];
    const qTitle = typeof q?.title === 'string' ? q.title.trim() : '';
    const optionA = typeof q?.option_a === 'string' ? q.option_a.trim() : '';
    const optionB = typeof q?.option_b === 'string' ? q.option_b.trim() : '';

    if (!optionA || !optionB) {
      return { ok: false, error: `${i + 1}번 질문의 선택지 A와 B를 모두 입력해 주세요.` };
    }
    if (qTitle.length > 120) {
      return { ok: false, error: `${i + 1}번 질문 제목은 120자 이내로 입력해 주세요.` };
    }
    if (optionA.length > 80 || optionB.length > 80) {
      return { ok: false, error: `${i + 1}번 질문의 각 선택지는 80자 이내로 입력해 주세요.` };
    }

    sanitizedQuestions.push({
      id: crypto.randomUUID(),
      title: qTitle || '둘 중 하나를 선택한다면?',
      option_a: optionA,
      option_b: optionB,
    });
  }

  return {
    ok: true,
    data: {
      title,
      description,
      author_nickname: authorNickname,
      category,
      is_public: isPublic,
      questions: sanitizedQuestions,
    },
    password: password || undefined,
  };
}
