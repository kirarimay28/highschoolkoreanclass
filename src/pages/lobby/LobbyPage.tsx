import { Link } from 'react-router-dom';
import { IconTile } from '@/components/common/IconTile';
import { CloudDivider } from '@/components/motifs/CloudDivider';
import { lobbyMenu } from '@/config/lobbyMenu';
import { roleLabels, withHonorific } from '@/config/roles';
import { useCurrentUser } from '@/context/AuthContext';

export function LobbyPage() {
  const user = useCurrentUser();
  const cards = lobbyMenu.filter((m) => m.showInLobby && (!m.roles || m.roles.includes(user.role)));

  return (
    <div className="mx-auto max-w-4xl">
      <section className="mb-6 text-center sm:mb-8">
        <p className="font-serif text-sm text-gold-dark">{roleLabels[user.role]}</p>
        <h1 className="title-gradient mt-1 pb-1 text-3xl font-bold sm:text-4xl">{withHonorific(user)}, 어서 오세요</h1>
        <p className="mt-1 text-sm text-ink-soft">오늘은 어떤 공부를 해 볼까요?</p>
        <CloudDivider className="mx-auto mt-4 max-w-md" />
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {cards.map((item, i) => (
          <Link
            key={item.id}
            to={item.path}
            style={{ animationDelay: `${i * 60}ms` }}
            className="royal-card group flex animate-fade-up items-center gap-4 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-glow sm:flex-col sm:items-start sm:gap-5 sm:p-8"
          >
            <IconTile icon={item.icon} tone={item.tone} size="lg" className="transition-transform group-hover:scale-105" />
            <div className="min-w-0">
              <h2 className="text-xl font-bold group-hover:text-royal sm:text-2xl">{item.title}</h2>
              <p className="mt-1 text-sm text-ink-soft sm:text-[15px]">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
