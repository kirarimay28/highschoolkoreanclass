/**
 * 문학 › 고전 어휘 데이터 (KoreanEdu src/data/vocabData.ts 의 「달콤한 국어 고어 단어 100」을 그대로 옮김)
 *
 * ⚠ 교사 검수 필요 — 출전 작품·갈래·시대(work / workId / genre / era)는 이 앱에서 새로 붙인 값입니다.
 *   확실한 것만 일부 넣었으니 수업 기준에 맞게 고치거나 더 채워 주세요. 뜻(answer)은 KoreanEdu 원본 그대로입니다.
 *
 * 필드
 *  · num / vocab / answer  번호 · 고어 · 현대어 뜻 (answer 의 괄호 속 내용은 채점 때 무시, 쉼표로 나눈 뜻은 순서 무관)
 *  · category              명사형 / 동사·형용사형 / 부사형 / 조사·어미형
 *  · workId                연대기 지도(src/data/literatureTimeline.ts) 작품의 id — 넣으면 작품명·갈래·시대가 지도 데이터에서 자동으로 채워지고,
 *                          단어장에서 작품을 누르면 지도의 그 작품 설명으로 이동
 *  · work / genre / era    지도에 없는 작품일 때 직접 적기 (era 는 지도 시대 id: ancient, unified-silla, goryeo-early, goryeo-late, joseon-early, joseon-late)
 */
import type { VocabItem } from '@/types/vocab';

export const vocabStandards = ['12문학01-03', '12문학01-06'];

export const VOCAB_ITEMS: VocabItem[] = [
  // ── 명사형 ──
  { num: 1, vocab: 'ᄀᆞ슬', answer: '가을', category: '명사형' },
  { num: 2, vocab: '나리(물)', answer: '시내(물)', category: '명사형' },
  { num: 3, vocab: '소반(小盤)', answer: '밥상', category: '명사형' },
  { num: 4, vocab: '바ᄅᆞ', answer: '바다', category: '명사형' },
  { num: 5, vocab: '졍지', answer: '부엌', category: '명사형', workId: 'cheongsan-byeolgok' },
  { num: 6, vocab: '님빅 / 곰빅', answer: '앞 / 뒤', category: '명사형' },
  { num: 7, vocab: '즈슬', answer: '모습을', category: '명사형' },
  { num: 8, vocab: '즈믄 / 온', answer: '천(1000) / 백(100)', category: '명사형', workId: 'seogyeong-byeolgok' },
  { num: 9, vocab: '별헤', answer: '벼랑에', category: '명사형' },
  { num: 10, vocab: '곶(ᄭᅩᆺ)', answer: '꽃', category: '명사형' },
  { num: 11, vocab: '백구', answer: '흰 갈매기', category: '명사형' },
  { num: 12, vocab: '이화', answer: '배꽃(흰색, 봄)', category: '명사형', work: '이화에 월백하고', genre: '시조', era: 'goryeo-late' },
  { num: 13, vocab: '도화', answer: '복숭아꽃(붉은색)', category: '명사형', workId: 'sangchungok' },
  { num: 14, vocab: '행화', answer: '살구꽃(분홍빛)', category: '명사형', workId: 'sangchungok' },
  { num: 15, vocab: '해오라비', answer: '해오라기, 하얀 백로', category: '명사형' },
  { num: 16, vocab: '뫼', answer: '산 / 수라(궁중용어)', category: '명사형' },
  { num: 17, vocab: '하얌(향암)', answer: '시골에 살아 세상 이치를 모르는 어리석은 사람', category: '명사형' },
  { num: 18, vocab: '소(沼) / 지당(池塘)', answer: '연못', category: '명사형' },
  { num: 19, vocab: '청약립 / 녹사의', answer: '갓 / 우비(소박한 옷차림)', category: '명사형', work: '어부사시사', genre: '시조', era: 'joseon-late' },
  { num: 20, vocab: '믈 / 블 / 플', answer: '물 / 불 / 풀', category: '명사형', workId: 'cheongsan-byeolgok' },
  { num: 21, vocab: '시비(柴扉)', answer: '사립문', category: '명사형' },
  { num: 22, vocab: '실솔', answer: '귀뚜라미', category: '명사형' },
  { num: 23, vocab: '즌ᄃᆡ', answer: '진 곳(위험한 곳)', category: '명사형', work: '정읍사', genre: '고대 가요', era: 'ancient' },
  { num: 24, vocab: '사창 / 옥창 / 규방', answer: '여인의 방', category: '명사형' },
  { num: 25, vocab: '해동 / 계림 / 동이 / 동방', answer: '우리나라', category: '명사형' },
  { num: 26, vocab: '여름', answer: '열매', category: '명사형' },
  { num: 27, vocab: '벽계수', answer: '푸른 시냇물', category: '명사형', workId: 'sangchungok' },
  { num: 28, vocab: '녀름', answer: '여름', category: '명사형' },
  { num: 29, vocab: 'ᄀᆞ름(가롬)', answer: '강', category: '명사형' },
  { num: 30, vocab: 'ᄯᅡ', answer: '땅', category: '명사형' },
  { num: 31, vocab: '관산', answer: '국경, 관문, 요새', category: '명사형' },
  { num: 32, vocab: 'ᄭᅳᆺ(ᄭᅳ)', answer: '끝', category: '명사형' },
  { num: 33, vocab: '촉(燭)', answer: '촛불', category: '명사형' },
  { num: 34, vocab: '녹양(綠楊) / 양류', answer: '버드나무', category: '명사형' },
  { num: 35, vocab: '연하 / 금수', answer: '안개와 노을 / 수놓은 비단', category: '명사형' },
  { num: 36, vocab: '혜음(혬, 혬가림)', answer: '근심, 걱정, 시름', category: '명사형' },
  { num: 37, vocab: '남여', answer: '가마', category: '명사형' },
  { num: 38, vocab: '황운(黃雲)', answer: '누렇게 익은 곡식', category: '명사형' },
  { num: 39, vocab: '건곤', answer: '하늘과 땅(온 세상)', category: '명사형', work: '사미인곡', genre: '가사', era: 'joseon-early' },
  { num: 40, vocab: '모쳠', answer: '초가의 처마', category: '명사형' },
  { num: 41, vocab: '늘애(늘의)', answer: '날개', category: '명사형' },
  { num: 42, vocab: '이리', answer: '아양', category: '명사형' },
  { num: 43, vocab: '삼춘 / 삼하 / 삼추 / 삼동', answer: '봄 / 여름 / 가을 / 겨울', category: '명사형' },
  { num: 44, vocab: '시앗', answer: '첩', category: '명사형' },
  { num: 45, vocab: '침선', answer: '바느질', category: '명사형' },
  { num: 46, vocab: '수품', answer: '솜씨, 실력, 능력', category: '명사형' },
  { num: 47, vocab: '잣', answer: '성(城)', category: '명사형' },
  { num: 48, vocab: 'ᄆᆞ슬(ᄆᆞ을)', answer: '마을', category: '명사형' },
  { num: 49, vocab: '파람', answer: '휘파람', category: '명사형' },
  { num: 50, vocab: '우음', answer: '웃음', category: '명사형' },
  { num: 51, vocab: '홍진(紅塵) / 풍진 / 진세 / 인간 / 인세 / 사바 / 하계 / 차안', answer: '세속적 세계, 인간세계, 삶의 세계', category: '명사형', workId: 'sangchungok' },
  // ── 동사·형용사형 ──
  { num: 52, vocab: '선ᄒᆞ다', answer: '서운하다', category: '동사·형용사형', workId: 'gasiri' },
  { num: 53, vocab: '녀다(니다, 녜다)', answer: '가다, 지내다, 살아가다', category: '동사·형용사형', workId: 'seogyeong-byeolgok' },
  { num: 54, vocab: '얼다', answer: '(육체적)사랑하다', category: '동사·형용사형' },
  { num: 55, vocab: '괴다', answer: '(정신적)사랑하다', category: '동사·형용사형' },
  { num: 56, vocab: '벼기다', answer: '우기다, 모함하다', category: '동사·형용사형' },
  { num: 57, vocab: '방송하다', answer: '내보내다, 석방하다', category: '동사·형용사형' },
  { num: 58, vocab: '늣기다(느끼다)', answer: '흐느끼다', category: '동사·형용사형' },
  { num: 59, vocab: '이슷하다', answer: '비슷하다', category: '동사·형용사형' },
  { num: 60, vocab: '혀다', answer: '(악기, 불)을 켜다', category: '동사·형용사형' },
  { num: 61, vocab: '어엿브다', answer: '불쌍하다', category: '동사·형용사형' },
  { num: 62, vocab: '싀어디여', answer: '사라져서, 죽어 없어져', category: '동사·형용사형' },
  { num: 63, vocab: '삼기다', answer: '생기다, 태어나다, 만들어지다', category: '동사·형용사형' },
  { num: 64, vocab: 'ᄭᅴ우다', answer: '꺼리다', category: '동사·형용사형' },
  { num: 65, vocab: 'ᄆᆞᆯ다 / 견화이다 / 마련하다', answer: '마름질하다 / 재단하다', category: '동사·형용사형' },
  { num: 66, vocab: '여다(여희다)', answer: '이별하다, 헤어지다', category: '동사·형용사형' },
  { num: 67, vocab: '둏다(됴타)', answer: '좋다', category: '동사·형용사형' },
  { num: 68, vocab: '좋다(조타)', answer: '깨끗하다', category: '동사·형용사형' },
  { num: 69, vocab: '헌사ᄒᆞ다', answer: '야단스럽다', category: '동사·형용사형' },
  { num: 70, vocab: '어리다', answer: '어리석다', category: '동사·형용사형' },
  { num: 71, vocab: '슬허하다', answer: '슬퍼하다', category: '동사·형용사형' },
  { num: 72, vocab: '외다', answer: '그르다, 잘못되다', category: '동사·형용사형' },
  { num: 73, vocab: '하다', answer: '많다(多), 크다(大)', category: '동사·형용사형' },
  { num: 74, vocab: '쟐다', answer: '짧다', category: '동사·형용사형' },
  { num: 75, vocab: '수이', answer: '쉽게', category: '동사·형용사형' },
  { num: 76, vocab: '긋다', answer: '끊어지다', category: '동사·형용사형' },
  { num: 77, vocab: '닛다', answer: '이어지다', category: '동사·형용사형' },
  { num: 78, vocab: '오뎐된', answer: '방정맞은', category: '동사·형용사형' },
  { num: 79, vocab: '고두', answer: '머리를 조아리다', category: '동사·형용사형' },
  { num: 80, vocab: '오마 ᄒᆞ다(오다ᄒᆞ다)', answer: '온다고 하다', category: '동사·형용사형' },
  { num: 81, vocab: '가시다', answer: '변하다, 바뀌다', category: '동사·형용사형' },
  // ── 부사형 ──
  { num: 82, vocab: 'ᄌᆞ로', answer: '자주', category: '부사형' },
  { num: 83, vocab: '모쳐라', answer: '마침', category: '부사형' },
  { num: 84, vocab: '고텨', answer: '다시', category: '부사형' },
  { num: 85, vocab: '져근덧 / 건듯', answer: '잠깐 사이에, 어느 덧, 문득', category: '부사형' },
  { num: 86, vocab: '슬ᄀᆞ장', answer: '실컷', category: '부사형' },
  { num: 87, vocab: 'ᄒᆞ마(하마)', answer: '이미, 벌써', category: '부사형' },
  { num: 88, vocab: '빗기(비겨)', answer: '비스듬히', category: '부사형' },
  { num: 89, vocab: '유세차', answer: '이해의 차례는(제문 첫머리 관용어)', category: '부사형', workId: 'jochimmun' },
  // ── 조사·어미형 ──
  { num: 90, vocab: '~ㄹ셰라', answer: '~할까 두렵다', category: '조사·어미형', workId: 'gasiri' },
  { num: 91, vocab: '~손ᄃᆡ', answer: '~에게', category: '조사·어미형' },
  { num: 92, vocab: '~도곤 / ~라와 / ~에', answer: '~보다(비교부사격조사)', category: '조사·어미형' },
  { num: 93, vocab: '~우희', answer: '~전에(시간) / ~위에(공간)', category: '조사·어미형' },
  { num: 94, vocab: '~다히(~다이)', answer: '~의, ~쪽(~답게)', category: '조사·어미형' },
  { num: 95, vocab: '~ᄃᆡ', answer: '~곳(장소)', category: '조사·어미형' },
  { num: 96, vocab: '~제', answer: '~때', category: '조사·어미형' },
  { num: 97, vocab: '~ᄏᆞ니와', answer: '물론이거니와', category: '조사·어미형' },
  { num: 98, vocab: '~하 / ~곰', answer: '~야(호격조사) / ~좀(강세접미사)', category: '조사·어미형' },
  { num: 99, vocab: '~고져', answer: '~하고자(소망, 의도)', category: '조사·어미형' },
  { num: 100, vocab: '~다호라', answer: '~같구나', category: '조사·어미형' },
];

/** 채점용 정규화 — 띄어쓰기와 괄호 속 내용(중첩 괄호 포함)을 무시 (KoreanEdu ea926f7·e101877) */
export function normalizeAnswer(s: string): string {
  let r = s;
  while (/\([^()]*\)/.test(r)) r = r.replace(/\([^()]*\)/g, '');
  return r.replace(/\s/g, '');
}

/** 쉼표로 나눈 뜻은 순서와 상관없이 모두 맞아야 정답 (KoreanEdu d3097ec) */
export function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const split = (s: string) =>
    normalizeAnswer(s)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .sort();
  const u = split(userAnswer);
  const c = split(correctAnswer);
  return u.length === c.length && u.every((v, i) => v === c[i]);
}
