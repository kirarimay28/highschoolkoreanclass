import { RoyalButton } from '@/components/common/RoyalButton';
import { boardVisibilityOptions } from '@/config/board';

/** 실명 / 익명 선택 */
export function VisibilityToggle({ anonymous, onChange }: { anonymous: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {boardVisibilityOptions.map((o) => (
        <RoyalButton
          key={o.id}
          size="sm"
          variant="secondary"
          active={anonymous === o.anonymous}
          onClick={() => onChange(o.anonymous)}
        >
          {o.label}
        </RoyalButton>
      ))}
    </div>
  );
}
