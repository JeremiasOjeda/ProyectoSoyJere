import type { BracketMatch, Player } from '@/types/protocol';

export function BracketView({
  bracket,
  players,
}: {
  bracket: BracketMatch[];
  players: Player[];
}) {
  const name = (id: string | null) =>
    id ? (players.find((p) => p.id === id)?.nickname ?? '?') : '—';

  const rounds = ['quarter', 'semi', 'final'] as const;
  const labels = { quarter: 'Cuartos', semi: 'Semis', final: 'Final' };

  return (
    <div className="flex flex-col gap-4">
      {rounds.map((round) => {
        const matches = bracket.filter((m) => m.round === round);
        if (!matches.length) return null;
        return (
          <section key={round}>
            <h3 className="mb-2 text-xs font-semibold uppercase text-zinc-500">
              {labels[round]}
            </h3>
            <ul className="space-y-2">
              {matches.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    m.completed ? 'border-amber-800/50 bg-amber-950/20' : 'border-zinc-800 bg-zinc-900'
                  }`}
                >
                  <span className={m.winner === m.fighterA ? 'text-amber-400 font-semibold' : ''}>
                    {name(m.fighterA)}
                  </span>
                  <span className="mx-2 text-zinc-600">vs</span>
                  <span className={m.winner === m.fighterB ? 'text-amber-400 font-semibold' : ''}>
                    {name(m.fighterB)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function ChampionScreen({
  championId,
  players,
}: {
  championId: string | null | undefined;
  players: Player[];
}) {
  const champ = players.find((p) => p.id === championId);
  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <p className="text-sm uppercase tracking-widest text-amber-500">Campeón</p>
      <h2 className="text-3xl font-bold text-amber-400">{champ?.nickname ?? '—'}</h2>
      <p className="text-zinc-400">¡Torneo completado!</p>
    </div>
  );
}
