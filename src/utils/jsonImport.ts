type LorebookImportEntry = { name: string; description: string; playerId?: string };

export const DUPLICATE_SUFFIX = ' - DUPLICATE';

type WorldImport = {
  name: string;
  description: string;
  adventureStart: string;
  visibility: string;
  narratorName: string;
  narratorPersonality: string;
  lorebook: LorebookImportEntry[];
};

type AdventureImport = WorldImport & {
  moderation: string;
  modelConfiguration?: { aiModel?: string; maxTokenLimit?: number; temperature?: number };
  contextAttributes?: { nudge?: string; authorsNote?: string; scene?: string; bump?: string; bumpFrequency?: number };
};

function str(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

function parseLorebookEntries(val: unknown): LorebookImportEntry[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e) => ({
      name: str(e.name),
      description: str(e.description),
      ...(typeof e.playerId === 'string' && { playerId: e.playerId }),
    }))
    .filter((e) => e.name || e.description);
}

export function parseLorebookJson(raw: unknown): LorebookImportEntry[] {
  if (Array.isArray(raw)) return parseLorebookEntries(raw);
  if (typeof raw !== 'object' || raw === null) return [];
  const j = raw as Record<string, unknown>;
  return parseLorebookEntries(j.lorebookEntries ?? j.lorebook);
}

export function mergeLorebookEntries<T extends { name: string }>(existing: T[], incoming: T[]): T[] {
  const taken = new Set(existing.map((entry) => entry.name.trim().toLowerCase()));

  const merged = incoming.map((entry) => {
    const key = entry.name.trim().toLowerCase();
    if (!taken.has(key)) {
      taken.add(key);
      return entry;
    }

    const renamed = `${entry.name}${DUPLICATE_SUFFIX}`;
    taken.add(renamed.trim().toLowerCase());
    return { ...entry, name: renamed };
  });

  return [...existing, ...merged];
}

export function hasDuplicateLorebookEntries(entries: { name: string }[]): boolean {
  return entries.some((entry) => entry.name.includes(DUPLICATE_SUFFIX));
}

export function parseWorldJson(raw: unknown): WorldImport {
  if (typeof raw !== 'object' || raw === null) return { name: '', description: '', adventureStart: '', visibility: '', narratorName: '', narratorPersonality: '', lorebook: [] };
  const j = raw as Record<string, unknown>;
  return {
    name: str(j.name),
    description: str(j.description),
    adventureStart: str(j.adventureStart),
    visibility: str(j.visibility),
    narratorName: str(j.narratorName),
    narratorPersonality: str(j.narratorPersonality),
    lorebook: parseLorebookEntries(j.lorebook),
  };
}

export function parseAdventureJson(raw: unknown): AdventureImport {
  if (typeof raw !== 'object' || raw === null) return { name: '', description: '', adventureStart: '', visibility: '', narratorName: '', narratorPersonality: '', lorebook: [], moderation: '' };
  const j = raw as Record<string, unknown>;
  const mc = typeof j.modelConfiguration === 'object' && j.modelConfiguration !== null
    ? j.modelConfiguration as Record<string, unknown>
    : null;
  const ca = typeof j.contextAttributes === 'object' && j.contextAttributes !== null
    ? j.contextAttributes as Record<string, unknown>
    : null;
  return {
    name: str(j.name),
    description: str(j.description),
    adventureStart: str(j.adventureStart),
    visibility: str(j.visibility),
    narratorName: str(j.narratorName),
    narratorPersonality: str(j.narratorPersonality),
    lorebook: parseLorebookEntries(j.lorebookEntries ?? j.lorebook),
    moderation: str(j.moderation),
    ...(mc && {
      modelConfiguration: {
        ...(typeof mc.aiModel === 'string' && { aiModel: mc.aiModel }),
        ...(typeof mc.maxTokenLimit === 'number' && { maxTokenLimit: mc.maxTokenLimit }),
        ...(typeof mc.temperature === 'number' && { temperature: mc.temperature }),
      },
    }),
    ...(ca && {
      contextAttributes: {
        nudge: str(ca.nudge),
        authorsNote: str(ca.authorsNote),
        scene: str(ca.scene),
        bump: str(ca.bump),
        ...(typeof ca.bumpFrequency === 'number' && { bumpFrequency: ca.bumpFrequency }),
      },
    }),
  };
}

type CharacterImport = {
  name: string;
  characterClass: string;
  personality: string;
  physicalDescription: string;
  attributes: Record<string, number>;
  skills: Record<string, number>;
  signatureSkill: Record<string, number>;
};

function numberMap(val: unknown): Record<string, number> {
  if (typeof val !== 'object' || val === null) return {};
  return Object.fromEntries(
    Object.entries(val as Record<string, unknown>).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number',
    ),
  );
}

export function parseCharacterJson(raw: unknown): CharacterImport {
  if (typeof raw !== 'object' || raw === null) return { name: '', characterClass: '', personality: '', physicalDescription: '', attributes: {}, skills: {}, signatureSkill: {} };
  const j = raw as Record<string, unknown>;
  return {
    name: str(j.name),
    characterClass: str(j.characterClass),
    personality: str(j.personality),
    physicalDescription: str(j.physicalDescription),
    attributes: numberMap(j.attributes),
    skills: numberMap(j.skills),
    signatureSkill: numberMap(j.signatureSkill),
  };
}

export function useJsonImport(onImport: (raw: unknown) => void) {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 1_000_000) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        onImport(JSON.parse(reader.result as string));
      } catch {
        // invalid JSON — ignore silently
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };
}
