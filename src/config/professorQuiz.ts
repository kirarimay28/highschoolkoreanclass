/**
 * 교수자용 퀴즈 로그인 설정.
 * 질문·선택지·정답·오답 문구를 여기서만 수정하면 됩니다.
 * 질문을 더 추가하면 순서대로 이어서 출제됩니다.
 */
export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  answer: string;
  /** 오답 시 번갈아 보여줄 문구 */
  wrongMessages: string[];
}

export const professorQuiz: QuizQuestion[] = [
  {
    id: 'course-name',
    question: '이 과목의 이름은 무엇인가요?',
    choices: ['AI디지털학습환경설계', 'AI돼지털학습환경설계', 'AI디지털환경학습설계'],
    answer: 'AI디지털학습환경설계',
    wrongMessages: [
      '전하, 과목명이 살짝 어긋났사옵니다. 다시 살펴 주시옵소서.',
      '꿀꿀… 아니옵니다. 다시 한번 골라 주시옵소서.',
      '글자 순서가 뒤바뀐 듯하옵니다, 전하.',
    ],
  },
  {
    id: 'grade',
    question: "이번 학기 '문서연' 학생에게 주고 싶은 학점은 어떤 것인가요?",
    choices: ['A+', 'B', 'C'],
    answer: 'A+',
    wrongMessages: [
      '전하, 다시 한번 숙고하여 주시옵소서.',
      '신하들이 술렁이옵니다… 한 번 더 굽어살펴 주시옵소서.',
      '성은이 망극하오나, 그 학점은 아니 될 말씀이옵니다.',
    ],
  },
];

/** 퀴즈 통과 후 로그인되는 교수자 계정 정보 */
export const professorAccount = {
  id: 'professor',
  name: '교수님',
} as const;

export const professorQuizText = {
  intro: '어전(御前) 문답에 모두 답하시면 입장하실 수 있사옵니다.',
  success: '성은이 망극하옵니다! 입장하시옵소서.',
};
