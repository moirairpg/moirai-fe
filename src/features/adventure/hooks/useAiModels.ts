import { useEffect, useState } from 'react';
import { apiFetch } from '../../../utils/api';

export type AiModel = {
  fullModelName: string;
  internalModelName: string;
  officialModelName: string;
  hardTokenLimit: number;
  responseTokenLimit: number;
};

export function useAiModels(): AiModel[] {
  const [models, setModels] = useState<AiModel[]>([]);

  useEffect(() => {
    apiFetch('/api/models')
      .then((res) => res.json())
      .then((data: AiModel[]) => setModels(data))
      .catch(() => setModels([]));
  }, []);

  return models;
}
