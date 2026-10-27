import { motion, useReducedMotion } from 'framer-motion';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Icon } from '@/components/common/Icon';
import { MedallionButton } from '@/components/common/MedallionButton';
import { CloudDivider } from '@/components/motifs/CloudDivider';
import { getSubject, subjectMedalLayoutId, subjectStyle } from '@/config/subjects';

/** 과목별 독립 페이지 — 그 과목 내용만 보임. 메뉴는 config/subjects.ts 의 sections */
export function SubjectPage() {
  const { subjectId } = useParams();
  const reduce = useReducedMotion() ?? false;
  const subject = getSubject(subjectId);
  if (!subject) return <Navigate to="/lobby?expand=subjects" replace />;

  // 메달이 로비에서 날아오는 동안 나머지는 살짝 늦게 나타남
  const fadeIn = (i: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: 0.25 + i * 0.05 } };

  return (
    <div className="subject-page relative" style={subjectStyle(subject)} data-subject={subject.id}>
      {/* 과목 색이 아주 옅게 번지는 배경 */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-80 w-[min(56rem,100vw)] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgb(var(--subject-tint) / 0.22), transparent)' }}
        aria-hidden
      />

      <Link
        to="/lobby?expand=subjects"
        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-[rgb(var(--subject-accent))]"
      >
        <Icon name="back" size={16} />
        과목 선택
      </Link>

      <header className="relative flex items-center gap-4 sm:gap-7">
        <MedallionButton
          size="md"
          icon={subject.icon}
          label={subject.name}
          interactive={false}
          showLabel={false}
          entrance={false}
          layoutId={subjectMedalLayoutId(subject.id)}
          colors={subject.accent}
        />
        <motion.div className="min-w-0" {...fadeIn(0)}>
          <p className="font-serif text-sm tracking-[0.4em] text-[rgb(var(--subject-gold))] sm:text-base">{subject.hanja}</p>
          <h1
            className="pb-1 font-display text-4xl font-black tracking-tight sm:text-6xl"
            style={{
              backgroundImage: 'linear-gradient(120deg, rgb(var(--subject-accent)) 0%, rgb(var(--subject-accent)) 45%, rgb(var(--subject-gold)) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {subject.name}
          </h1>
          <p className="mt-1 text-sm text-ink-soft sm:text-base">{subject.description}</p>
        </motion.div>
        <span
          className="pointer-events-none absolute -right-2 -top-6 hidden select-none font-serif text-[9rem] font-bold leading-none text-[rgb(var(--subject-gold)/0.08)] sm:block"
          aria-hidden
        >
          {subject.hanja}
        </span>
      </header>

      <motion.div {...fadeIn(1)}>
        <CloudDivider className="my-6 text-[rgb(var(--subject-gold))] sm:my-8" />
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {subject.sections.map((sec, i) => (
          <motion.section key={sec.id} className="royal-card p-5" {...fadeIn(i + 2)}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--subject-accent)/0.08)] text-[rgb(var(--subject-accent))] ring-1 ring-inset ring-[rgb(var(--subject-accent)/0.15)]">
                  <Icon name={sec.icon} size={20} />
                </span>
                <h2 className="text-lg font-bold">{sec.title}</h2>
              </div>
              <Badge className="border-[rgb(var(--subject-gold)/0.4)] bg-[rgb(var(--subject-gold)/0.1)] text-[rgb(var(--subject-accent))]">준비 중</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{sec.description}</p>
            <div className="mt-4 rounded-2xl border border-dashed border-[rgb(var(--subject-gold)/0.4)] bg-white/40 px-4 py-6 text-center text-sm text-ink-faint">
              {subject.name} {sec.title} 콘텐츠가 곧 채워질 예정입니다.
            </div>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
