import { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/api';
import type { AttributeVocabulary } from '../types';

let cache: AttributeVocabulary | null = null;

export function useAttributeVocabulary(): { vocabulary: AttributeVocabulary | null; isLoading: boolean } {
  const [vocabulary, setVocabulary] = useState<AttributeVocabulary | null>(cache);

  useEffect(() => {
    if (cache !== null) {
      return;
    }

    apiFetch('/api/player-characters/attributes')
      .then((res) => res.json())
      .then((json: AttributeVocabulary) => {
        cache = json;
        setVocabulary(json);
      })
      .catch(() => {});
  }, []);

  return { vocabulary, isLoading: vocabulary === null };
}
