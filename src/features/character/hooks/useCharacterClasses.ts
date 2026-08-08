import { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import type { CharacterClassOption } from '../types';

let cache: CharacterClassOption[] | null = null;

export function useCharacterClasses(): {
  classes: CharacterClassOption[];
  labelOf: (name: string | null) => string | null;
  isLoading: boolean;
} {
  const [classes, setClasses] = useState<CharacterClassOption[]>(cache ?? []);
  const [isLoading, setIsLoading] = useState(cache === null);

  useEffect(() => {
    if (cache !== null) {
      return;
    }

    apiFetch('/api/character-classes')
      .then((res) => res.json())
      .then((json: CharacterClassOption[]) => {
        cache = json;
        setClasses(json);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const labelOf = (name: string | null) =>
    name === null ? null : (classes.find((option) => option.name === name)?.label ?? name);

  return { classes, labelOf, isLoading };
}
