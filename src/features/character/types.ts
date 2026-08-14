import type { CHARACTER_ATTRIBUTES } from './attributes';

export type CharacterAttributeName = (typeof CHARACTER_ATTRIBUTES)[number];
export type CharacterAttributes = Record<CharacterAttributeName, number>;

export type PlayerCharacterDetails = {
  id: string;
  ownerUsername: string;
  name: string;
  characterClass: string | null;
  personality: string;
  physicalDescription: string;
  attributes: CharacterAttributes;
  imageUrl: string | null;
  uiImagePositionX: number | null;
  uiImagePositionY: number | null;
  canManage: boolean;
  isOwner: boolean;
  creationDate: string;
  lastUpdateDate: string;
};

export type CharacterFormInput = {
  name: string;
  characterClass: string;
  personality: string;
  physicalDescription: string;
};

export type CharacterClassOption = {
  name: string;
  label: string;
};

export type CharacterAdventureSummary = {
  publicId: string;
  name: string;
  imageUrl: string | null;
};
