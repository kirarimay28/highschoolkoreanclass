/**
 * 학생 명단 (샘플)
 * ─────────────────────────────────────────────
 * 실제 명단이 오면 둘 중 하나로 교체하세요.
 *  1) 이 배열을 직접 교체
 *  2) src/data/students.csv 를 만들고 아래 csvRoster 주석을 해제
 *     (CSV 헤더: 학번,이름,학년,반,번호,비밀번호)
 *     → 파싱은 src/services/rosterService.ts 의 parseStudentCsv 가 담당
 * 엑셀은 "CSV UTF-8" 형식으로 저장하면 됩니다.
 */
export interface StudentRecord {
  studentId: string; // 학번 (예: 20301 = 2학년 3반 1번)
  name: string;
  grade: number;
  classNo: number;
  number: number;
  password: string;
}

export const studentsMock: StudentRecord[] = [
  { studentId: '20301', name: '김하늘', grade: 2, classNo: 3, number: 1, password: '1234' },
  { studentId: '20302', name: '문서연', grade: 2, classNo: 3, number: 2, password: '1234' },
  { studentId: '20303', name: '박지후', grade: 2, classNo: 3, number: 3, password: '1234' },
  { studentId: '20304', name: '이도윤', grade: 2, classNo: 3, number: 4, password: '1234' },
  { studentId: '20305', name: '최유나', grade: 2, classNo: 3, number: 5, password: '1234' },
];

// import csvText from './students.csv?raw';
// import { parseStudentCsv } from '@/services/rosterService';
// export const csvRoster = parseStudentCsv(csvText);
