import type { NarrationLine } from '@/types/protocol';

export function NarrationFeed({ lines }: { lines: NarrationLine[] }) {
  return (
    <div className="flex max-h-64 flex-col gap-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      {lines.length === 0 && (
        <p className="text-sm text-zinc-500">Esperando narración…</p>
      )}
      {lines.map((line) => (
        <p
          key={line.id}
          className={`text-sm leading-relaxed ${
            line.phase === 'result'
              ? 'font-semibold text-amber-400'
              : line.phase === 'intro'
                ? 'text-zinc-200'
                : 'text-zinc-400'
          }`}
        >
          {line.text}
        </p>
      ))}
    </div>
  );
}

export function ArenaBanner({ arena }: { arena?: string }) {
  if (!arena) return null;
  const labels: Record<string, string> = {
    forest: 'Bosque',
    desert: 'Desierto',
    castle: 'Castillo',
    volcano: 'Volcán',
    ice: 'Hielo',
    arena: 'Arena',
  };
  return (
    <div className="rounded-lg bg-gradient-to-r from-amber-900/40 to-zinc-900 px-4 py-3 text-center">
      <span className="text-xs uppercase tracking-widest text-amber-500">Arena</span>
      <p className="text-lg font-bold">{labels[arena] ?? arena}</p>
    </div>
  );
}
