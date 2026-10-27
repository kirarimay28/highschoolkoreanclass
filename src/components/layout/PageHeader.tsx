import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { CloudDivider } from '@/components/motifs/CloudDivider';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** 뒤로 가기 링크 (기본: 로비) */
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, backTo = '/lobby', backLabel = '로비', actions }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <Link to={backTo} className="mb-2 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-royal">
        <Icon name="back" size={16} />
        {backLabel}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="title-gradient pb-1 text-3xl font-bold sm:text-4xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-soft sm:text-base">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <CloudDivider className="mt-4" />
    </header>
  );
}
