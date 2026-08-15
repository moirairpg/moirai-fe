import { useCallback, useState } from 'react';
import type { CharacterAttributes } from '../types';
import { useAttributeVocabulary } from './useAttributeVocabulary';

export function useAttributeAllocation() {
  const { vocabulary } = useAttributeVocabulary();
  const [pending, setPending] = useState<Record<string, number>>({});

  const attributes = vocabulary?.attributes ?? [];
  const creation = vocabulary?.creation ?? null;

  const levelOf = (attribute: string) => pending[attribute] ?? 0;
  const spent = attributes.reduce((sum, attribute) => sum + levelOf(attribute.name), 0);
  const remaining = (creation?.points ?? 0) - spent;

  const increment = (attribute: string) =>
    setPending((prev) => ({ ...prev, [attribute]: (prev[attribute] ?? 0) + 1 }));

  const decrement = (attribute: string) =>
    setPending((prev) => ({ ...prev, [attribute]: (prev[attribute] ?? 0) - 1 }));

  const reset = useCallback(() => setPending({}), []);

  const importLevels = (importedLevels: Record<string, number>) => {
    const cap = creation?.levelCap ?? 0;
    setPending(Object.fromEntries(
      Object.entries(importedLevels).map(([name, level]) => [name, Math.min(Math.max(level, 0), cap)]),
    ));
  };

  const canIncrement = (attribute: string) =>
    creation !== null && levelOf(attribute) < creation.levelCap && remaining > 0;

  const canDecrement = (attribute: string) => levelOf(attribute) > 0;

  const isComplete = creation !== null && remaining === 0;

  const levels: CharacterAttributes = Object.fromEntries(
    attributes.map((attribute) => [attribute.name, levelOf(attribute.name)]),
  );

  return {
    attributes,
    maxLevel: vocabulary?.maxLevel ?? 0,
    levels,
    remaining,
    isComplete,
    increment,
    decrement,
    reset,
    importLevels,
    canIncrement,
    canDecrement,
    levelOf,
  };
}
