export const NOTIFICATION_KIND = {
  ADVENTURE_INVITE: 'ADVENTURE_INVITE',
  ADVENTURE_INVITE_RESPONSE: 'ADVENTURE_INVITE_RESPONSE',
  ADVENTURE_MEMBER_LEFT: 'ADVENTURE_MEMBER_LEFT',
  ADVENTURE_MEMBER_REMOVED: 'ADVENTURE_MEMBER_REMOVED',
  ADVENTURE_CHARACTER_DELETED: 'ADVENTURE_CHARACTER_DELETED',
} as const;

export type NotificationKind = typeof NOTIFICATION_KIND[keyof typeof NOTIFICATION_KIND];

export type NotificationMetadata = {
  kind?: NotificationKind;
  adventureId?: string;
  adventureName?: string;
  username?: string;
} | null;

const ROSTER_CHANGED_KINDS: readonly NotificationKind[] = [
  NOTIFICATION_KIND.ADVENTURE_INVITE_RESPONSE,
  NOTIFICATION_KIND.ADVENTURE_MEMBER_REMOVED,
  NOTIFICATION_KIND.ADVENTURE_MEMBER_LEFT,
  NOTIFICATION_KIND.ADVENTURE_CHARACTER_DELETED,
];

export function changesRoster(kind: NotificationKind | undefined): boolean {
  return kind !== undefined && ROSTER_CHANGED_KINDS.includes(kind);
}
