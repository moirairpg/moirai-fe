export type PermissionLevel = 'READ' | 'WRITE' | 'OWNER';

export type ManagedAssetKind = 'worlds' | 'adventures';

export type AssetMember = {
  userId: string;
  username: string;
  level: PermissionLevel;
};

export type AssetMemberDraft = {
  userId: string | null;
  username: string;
  level: PermissionLevel;
};
