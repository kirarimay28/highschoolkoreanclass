import { studentsMock, type StudentRecord } from '@/data/students.mock';

/** 현재 사용하는 학생 명단. CSV 로 교체 시 이 함수의 반환값만 바꾸면 됩니다. */
export function getStudentRoster(): StudentRecord[] {
  return studentsMock;
}

/**
 * CSV 명단 파서
 * 헤더 예: 학번,이름,학년,반,번호,비밀번호
 * (영문 헤더 studentId,name,grade,classNo,number,password 도 허용)
 * 학번이 20301 형식이면 학년/반/번호는 비워 둬도 학번에서 계산합니다.
 */
export function parseStudentCsv(csvText: string): StudentRecord[] {
  const lines = csvText
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((h) => h.trim());
  const col = (names: string[]) => header.findIndex((h) => names.includes(h));
  const idx = {
    studentId: col(['학번', 'studentId']),
    name: col(['이름', 'name']),
    grade: col(['학년', 'grade']),
    classNo: col(['반', 'classNo']),
    number: col(['번호', 'number']),
    password: col(['비밀번호', 'password']),
  };

  return lines.slice(1).flatMap((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const studentId = cells[idx.studentId];
    const name = cells[idx.name];
    if (!studentId || !name) return [];
    const fromId = (start: number, end: number) => Number(studentId.slice(start, end)) || 0;
    const num = (i: number, fallback: number) => (i >= 0 && cells[i] ? Number(cells[i]) : fallback);
    return [
      {
        studentId,
        name,
        grade: num(idx.grade, fromId(0, 1)),
        classNo: num(idx.classNo, fromId(1, 3)),
        number: num(idx.number, fromId(3, 5)),
        // 비밀번호 칸이 없으면 학번 뒤 4자리를 초기 비밀번호로 사용
        password: (idx.password >= 0 && cells[idx.password]) || studentId.slice(-4),
      },
    ];
  });
}
