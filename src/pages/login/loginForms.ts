import type { ComponentType } from 'react';
import type { Role, User } from '@/types';
import { ProfessorQuizForm } from './ProfessorQuizForm';
import { StudentLoginForm } from './StudentLoginForm';
import { TeacherLoginForm } from './TeacherLoginForm';

export interface LoginFormProps {
  onSuccess: (user: User) => void;
}

/** 역할 → 로그인 폼 연결 (역할 버튼 목록은 src/config/roles.ts) */
export const loginForms: Record<Role, ComponentType<LoginFormProps>> = {
  student: StudentLoginForm,
  teacher: TeacherLoginForm,
  professor: ProfessorQuizForm,
};
