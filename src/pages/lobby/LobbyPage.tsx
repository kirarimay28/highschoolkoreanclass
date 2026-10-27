import { Link } from 'react-router-dom';
import { Icon } from '@/components/common/Icon';
import { CloudDivider } from '@/components/motifs/CloudDivider';
import { lobbyMenu } from '@/config/lobbyMenu';
import { roleLabels, withHonorific } from '@/config/roles';
import { useCurrentUser } from '@/context/AuthContext';

export function LobbyPage() {
  const user = useCurrentUser();
  const menu = lobbyMenu.filter((m) => !m.roles || m.roles.includes(user.role));

  return (
    <div>
      <section className="mb-6 text-center sm:mb-8">
        <p className="font-serif text-sm text-gold-dark">{roleLabels[user.role]}</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{withHonorific(user)}, 어서 오세요</h1>
        <p className="mt-1 text-sm text-ink-soft">오늘은 어떤 공부를 해 볼까요?</p>
        <CloudDivider className="mx-auto mt-4 max-w-md" />
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {menu.map((item, i) => (
          <Link
            key={item.id}
            to={item.path}
            style={{ animationDelay: `${i * 50}ms` }}
            className="royal-card group flex animate-fade-up items-center gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:shadow-glow sm:flex-col sm:items-start sm:p-6"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-royal text-gold-light transition-transform group-hover:scale-105 sm:h-14 sm:w-14">
              <Icon name={item.icon} size={24} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold group-hover:text-royal sm:text-xl">{item.title}</h2>
              <p className="mt-0.5 text-sm text-ink-soft">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
