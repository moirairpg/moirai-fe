export type PlayerCharacterDetails = {
  id: string;
  ownerUsername: string;
  name: string;
  characterClass: string | null;
  personality: string;
  physicalDescription: string;
  imageUrl: string | null;
  uiImagePositionX: number | null;
  uiImagePositionY: number | null;
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
};
