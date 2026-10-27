import type { IconName } from '@/components/common/icons';
import type { Role } from '@/types';

export interface LoginRoleOption {
  id: Role;
  label: string;
  description: string;
  icon: IconName;
}

/**
 * 로그인 화면의 역할 선택 버튼.
 * 순서를 바꾸거나 항목을 빼면 로그인 화면이 그대로 바뀝니다.
 * (각 역할의 입력 폼은 src/pages/login/loginForms.ts 에서 연결)
 */
export const loginRoles: LoginRoleOption[] = [
  { id: 'student', label: '학생용', description: '이름과 학번으로 입장', icon: 'graduation' },
  { id: 'teacher', label: '선생님용', description: '교직원 ID로 입장', icon: 'feather' },
  { id: 'professor', label: '교수자용', description: '퀴즈를 풀고 입장', icon: 'crown' },
];

/** 이름 뒤에 붙는 호칭 (예: 김하늘님, 정국어 선생님) */
export const roleHonorifics: Record<Role, string> = {
  student: '님',
  teacher: ' 선생님',
  professor: '',
};

export function withHonorific(user: { name: string; role: Role }): string {
  return `${user.name}${roleHonorifics[user.role]}`;
}

/** 화면에 표시할 역할 이름 */
export const roleLabels: Record<Role, string> = {
  student: '학생',
  teacher: '선생님',
  professor: '교수자',
};
