export type AdventureSummary = {
  id: string;
  name: string;
  description: string;
  worldName: string | null;
  narratorName: string | null;
  visibility: string;
  creationDate: string;
  imageUrl: string | null;
  canWrite: boolean;
};

export type WorldSummary = {
  id: string;
  name: string;
  description: string;
  visibility: string;
  creationDate: string;
  imageUrl: string | null;
  canWrite: boolean;
};

export type PlayerCharacterSummary = {
  id: string;
  ownerUsername: string;
  name: string;
  characterClass: string | null;
  imageUrl: string | null;
};

export type PaginatedResult<T> = {
  data: T[];
  items: number;
  totalItems: number;
  page: number;
  totalPages: number;
};

export type CollectionView = 'MY_STUFF' | 'SHARED_WITH_ME' | 'EXPLORE';
export type CollectionTab = 'adventures' | 'worlds' | 'characters';
