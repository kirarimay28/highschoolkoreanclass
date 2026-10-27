import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import type { IconName } from '@/components/common/icons';
import { MedallionButton } from '@/components/common/MedallionButton';
import { CloudDivider } from '@/components/motifs/CloudDivider';
import { accentStyle, type PageAccent } from '@/utils/accent';

interface MedalPageHeaderProps {
  backTo: string;
  backLabel: string;
  icon: IconName;
  title: string;
  hanja?: string;
  description?: string;
  accent: PageAccent;
  /** 로비 메달과 같은 값이면 메달이 날아와 앉는 전환 */
  layoutId?: string;
  children: ReactNode;
}

/**
 * 메달 + 큰 제목 헤더를 가진 독립 페이지 틀 (과목 페이지, 스터디룸 도구 페이지)
 * children 은 헤더 아래 본문. 본문 안에서는 rgb(var(--page-accent)) 등으로 페이지 색을 쓸 수 있음.
 */
export function MedalPageHeader({ backTo, backLabel, icon, title, hanja, description, accent, layoutId, children }: MedalPageHeaderProps) {
  const reduce = useReducedMotion() ?? false;
  // 메달이 날아오는 동안 나머지는 살짝 늦게 나타남
  const fadeIn = (i: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
      : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: 0.25 + i * 0.05 } };

  return (
    <div className="relative" style={accentStyle(accent)}>
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-80 w-[min(56rem,100vw)] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgb(var(--page-tint) / 0.22), transparent)' }}
        aria-hidden
      />

      <Link to={backTo} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-[rgb(var(--page-accent))]">
        <Icon name="back" size={16} />
        {backLabel}
      </Link>

      <header className="relative flex items-center gap-4 sm:gap-7">
        <MedallionButton
          size="md"
          icon={icon}
          label={title}
          interactive={false}
          showLabel={false}
          entrance={false}
          layoutId={layoutId}
          colors={accent}
        />
        <motion.div className="min-w-0" {...fadeIn(0)}>
          {hanja && <p className="font-serif text-sm tracking-[0.4em] text-[rgb(var(--page-gold))] sm:text-base">{hanja}</p>}
          <h1
            className="pb-1 font-display text-4xl font-black tracking-tight sm:text-6xl"
            style={{
              backgroundImage: 'linear-gradient(120deg, rgb(var(--page-accent)) 0%, rgb(var(--page-accent)) 45%, rgb(var(--page-gold)) 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {title}
          </h1>
          {description && <p className="mt-1 text-sm text-ink-soft sm:text-base">{description}</p>}
        </motion.div>
        {hanja && (
          <span
            className="pointer-events-none absolute -right-2 -top-6 hidden select-none font-serif text-[9rem] font-bold leading-none text-[rgb(var(--page-gold)/0.08)] sm:block"
            aria-hidden
          >
            {hanja}
          </span>
        )}
      </header>

      <motion.div {...fadeIn(1)}>
        <CloudDivider className="my-6 text-[rgb(var(--page-gold))] sm:my-8" />
      </motion.div>

      <motion.div {...fadeIn(2)}>{children}</motion.div>
    </div>
  );
}
