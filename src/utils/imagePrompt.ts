import type { LorebookEntry } from '../shared/types/lorebook';

const generationInstruction = (subject: string) =>
  `Generate an image based on information provided about the ${subject}. Make it epic, fitting for fantasy. Make in the style of a painting. Do not include any text in the image, simply generate the image based on the information provided below.`;

type ImagePromptField = { label: string; value?: string | null };

type LorebookMatchInput = { entries: LorebookEntry[]; text: string };

type ImagePromptInput = {
  subject: string;
  fields: ImagePromptField[];
  lorebook?: LorebookMatchInput;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const containsWholeWord = (word: string, text: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(word)}(?![\\p{L}\\p{N}])`, 'iu').test(text);

const matchesText = (entry: LorebookEntry, text: string) =>
  entry.name
    .split(/\s+/)
    .filter(Boolean)
    .some((word) => containsWholeWord(word, text));

export function buildImagePrompt({ subject, fields, lorebook }: ImagePromptInput): string {
  const lines = fields
    .filter((field) => field.value)
    .map((field) => `${field.label}: ${field.value}`);

  const loreLines = (lorebook?.entries ?? [])
    .filter((entry) => matchesText(entry, lorebook!.text))
    .map((entry) => `${entry.name}: ${entry.description}`);

  return [generationInstruction(subject), ...lines, ...loreLines].join('\n');
}
