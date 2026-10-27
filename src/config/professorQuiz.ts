/**
 * 교수자용 퀴즈 로그인 설정.
 * 질문·선택지·정답·오답 문구를 여기서만 수정하면 됩니다.
 * 질문을 더 추가하면 순서대로 이어서 출제됩니다.
 */
export interface QuizQuestion {
  id: string;
  question: string;
  /** 선택지. 비우면 직접 입력하는 문항 (띄어쓰기 무시하고 answer 와 비교) */
  choices: string[];
  /** 직접 입력 문항의 입력칸 안내 */
  placeholder?: string;
  answer: string;
  /** 오답 시 번갈아 보여줄 문구 */
  wrongMessages: string[];
}

export const professorQuiz: QuizQuestion[] = [
  {
    id: 'name',
    question: '성함을 입력해 주세요.',
    choices: [],
    placeholder: '이름',
    answer: '황현우',
    wrongMessages: ['등록된 교수자 이름이 아니에요. 다시 확인해 주세요.'],
  },
  {
    id: 'course-name',
    question: '이 과목의 이름은 무엇인가요?',
    choices: ['AI디지털학습환경설계', 'AI돼지털학습환경설계', 'AI디지털환경학습설계'],
    answer: 'AI디지털학습환경설계',
    wrongMessages: [
      '과목명이 살짝 달라요. 다시 확인해 주세요.',
      '꿀꿀… 아니에요. 다시 골라 주세요.',
      '글자 순서가 바뀐 것 같아요.',
    ],
  },
  {
    id: 'grade',
    question: "이번 학기 '문서연' 학생에게 주고 싶은 학점은 어떤 것인가요?",
    choices: ['A+', 'B', 'C'],
    answer: 'A+',
    wrongMessages: [
      '다시 한번 생각해 주세요.',
      '정말요…? 한 번만 더 생각해 주세요.',
      '그 학점은 안 돼요!',
    ],
  },
];

/** 퀴즈 통과 후 로그인되는 교수자 계정 정보 */
export const professorAccount = {
  id: 'professor',
  name: '황현우',
} as const;

export const professorQuizText = {
  intro: '질문에 모두 맞히면 입장할 수 있어요.',
  success: '정답이에요! 입장합니다.',
};
