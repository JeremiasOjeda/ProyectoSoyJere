import { useState } from 'react';
import {
  BUILD_SLOTS,
  EQUIPMENT_CATALOG,
  LABELS,
  defaultBuild,
  type CharacterBuild,
} from '@/types/equipment';

const TABS = [
  { id: 'base', label: 'Base', slots: ['archetype', 'style'] as const },
  { id: 'armor', label: 'Defensa', slots: ['armor', 'helmet', 'shield'] as const },
  { id: 'offense', label: 'Ataque', slots: ['weapon', 'element'] as const },
  { id: 'extra', label: 'Extra', slots: ['artifact', 'ability', 'consumable'] as const },
];

export function LoadoutWizard({
  initial,
  onSubmit,
  deadline,
}: {
  initial?: CharacterBuild;
  onSubmit: (build: CharacterBuild) => void;
  deadline?: number | null;
}) {
  const [build, setBuild] = useState<CharacterBuild>(initial ?? defaultBuild());
  const [tab, setTab] = useState(0);

  const setSlot = (slot: keyof CharacterBuild, value: string) => {
    setBuild((b) => ({ ...b, [slot]: value }));
  };

  const current = TABS[tab];
  const remaining = deadline ? Math.max(0, Math.ceil((deadline - Date.now()) / 1000)) : null;

  return (
    <div className="flex flex-col gap-4">
      {remaining !== null && (
        <p className="text-center text-sm text-amber-400">Tiempo: {remaining}s</p>
      )}
      <div className="flex gap-1">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(i)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium ${
              tab === i ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {current.slots.map((slot) => (
          <label key={slot} className="flex flex-col gap-1">
            <span className="text-xs uppercase text-zinc-500">{slot}</span>
            <select
              value={build[slot] as string}
              onChange={(e) => setSlot(slot, e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
            >
              {EQUIPMENT_CATALOG[slot].map((opt) => (
                <option key={opt} value={opt}>
                  {LABELS[opt] ?? opt}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSubmit(build)}
        className="rounded-xl bg-amber-500 py-4 font-semibold text-zinc-950"
      >
        Confirmar build
      </button>
    </div>
  );
}

export function UpgradePicker({
  build,
  onUpgrade,
}: {
  build: CharacterBuild;
  onUpgrade: (slot: keyof CharacterBuild, value: string) => void;
}) {
  const [slot, setSlot] = useState<keyof CharacterBuild>('weapon');
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-400">Elegí un slot para mejorar:</p>
      <select
        value={slot}
        onChange={(e) => setSlot(e.target.value as keyof CharacterBuild)}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
      >
        {BUILD_SLOTS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        value={build[slot] as string}
        onChange={(e) => onUpgrade(slot, e.target.value)}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2"
      >
        {EQUIPMENT_CATALOG[slot as keyof typeof EQUIPMENT_CATALOG]?.map((opt) => (
          <option key={opt} value={opt}>
            {LABELS[opt] ?? opt}
          </option>
        ))}
      </select>
    </div>
  );
}
