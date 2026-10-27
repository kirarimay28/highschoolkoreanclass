/** 선생님 mock 계정 — 실제 인증 연결 전까지 사용 */
export interface TeacherRecord {
  staffId: string;
  name: string;
  password: string;
}

export const teachersMock: TeacherRecord[] = [
  { staffId: 'teacher01', name: '정국어', password: 'teacher' },
  { staffId: 'teacher02', name: '한문학', password: 'teacher' },
];
