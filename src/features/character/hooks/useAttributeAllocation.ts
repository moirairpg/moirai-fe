import { useCallback, useState } from 'react';
import { ATTRIBUTE_CREATION_CAP, ATTRIBUTE_CREATION_POINTS, CHARACTER_ATTRIBUTES } from '../attributes';
import type { CharacterAttributeName, CharacterAttributes } from '../types';

const EMPTY_ALLOCATION: CharacterAttributes = {
  STRENGTH: 0,
  AGILITY: 0,
  VIGOR: 0,
  INTELLIGENCE: 0,
  AWARENESS: 0,
  CHARISMA: 0,
};

export function useAttributeAllocation() {
  const [levels, setLevels] = useState<CharacterAttributes>(EMPTY_ALLOCATION);

  const spent = CHARACTER_ATTRIBUTES.reduce((sum, attribute) => sum + levels[attribute], 0);
  const remaining = ATTRIBUTE_CREATION_POINTS - spent;

  const increment = (attribute: CharacterAttributeName) =>
    setLevels((prev) => ({ ...prev, [attribute]: prev[attribute] + 1 }));

  const decrement = (attribute: CharacterAttributeName) =>
    setLevels((prev) => ({ ...prev, [attribute]: prev[attribute] - 1 }));

  const reset = useCallback(() => setLevels(EMPTY_ALLOCATION), []);

  const canIncrement = (attribute: CharacterAttributeName) =>
    levels[attribute] < ATTRIBUTE_CREATION_CAP && remaining > 0;

  const canDecrement = (attribute: CharacterAttributeName) => levels[attribute] > 0;

  const isComplete = remaining === 0;

  return { levels, remaining, isComplete, increment, decrement, reset, canIncrement, canDecrement };
}
