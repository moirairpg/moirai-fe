import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../../utils/api';
import type { PlayerCharacterSummary, PaginatedResult } from '../types';

type UseCharacterCollectionResult = {
  items: PlayerCharacterSummary[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  removeItem: (id: string) => void;
};

export function useCharacterCollection(): UseCharacterCollectionResult {
  const [items, setItems] = useState<PlayerCharacterSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(false);
    setIsLoading(true);

    apiFetch('/api/player-characters?page=1&size=20')
      .then((res) => res.json())
      .then((json: PaginatedResult<PlayerCharacterSummary>) => {
        setItems(json.data);
        setHasMore(json.page < json.totalPages);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    apiFetch(`/api/player-characters?page=${nextPage}&size=20`)
      .then((res) => res.json())
      .then((json: PaginatedResult<PlayerCharacterSummary>) => {
        setItems((prev) => [...prev, ...json.data]);
        setPage(nextPage);
        setHasMore(json.page < json.totalPages);
      })
      .catch(() => {});
  }, [page]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((character) => character.id !== id));
  }, []);

  return { items, isLoading, hasMore, loadMore, removeItem };
}
