/**
 * 처음 실행할 때 명단에 미리 들어가는 샘플 학생.
 * 선생님 계정의 [학생 등록] 화면에서 지우거나 새로 등록할 수 있습니다.
 * 샘플이 필요 없으면 이 배열을 비워 두세요.
 */
export interface StudentSeed {
  studentId: string; // 학번 (예: 20301 = 2학년 3반 1번)
  name: string;
}

export const studentsMock: StudentSeed[] = [
  { studentId: '20301', name: '김하늘' },
  { studentId: '20302', name: '문서연' },
  { studentId: '20303', name: '박지후' },
  { studentId: '20304', name: '이도윤' },
  { studentId: '20305', name: '최유나' },
];
