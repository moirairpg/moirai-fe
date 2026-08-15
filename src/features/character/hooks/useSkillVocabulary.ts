import { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import type { SkillVocabulary } from '../types';

let cache: SkillVocabulary | null = null;

export function useSkillVocabulary(): { vocabulary: SkillVocabulary | null; isLoading: boolean } {
  const [vocabulary, setVocabulary] = useState<SkillVocabulary | null>(cache);

  useEffect(() => {
    if (cache !== null) {
      return;
    }

    apiFetch('/api/player-characters/skills')
      .then((res) => res.json())
      .then((json: SkillVocabulary) => {
        cache = json;
        setVocabulary(json);
      })
      .catch(() => {});
  }, []);

  return { vocabulary, isLoading: vocabulary === null };
}
