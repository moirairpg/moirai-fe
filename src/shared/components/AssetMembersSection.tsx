import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssetMembers } from '../hooks/useAssetMembers';
import type { AssetMemberDraft, ManagedAssetKind, PermissionLevel } from '../types/permissions';

type AssetMemberRowProps = {
  member: AssetMemberDraft;
  isPublic: boolean;
  readOnly: boolean;
  onLevelChange: (level: PermissionLevel) => void;
  onRemove: () => void;
};

function AssetMemberRow({ member, isPublic, readOnly, onLevelChange, onRemove }: AssetMemberRowProps) {
  const { t } = useTranslation('common');
  const isOwnerRow = member.level === 'OWNER';
  const hasNoEffect = isPublic && member.level === 'READ';

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2">
      <span className="flex-1 truncate text-sm text-foreground">{member.username}</span>

      {hasNoEffect && (
        <span className="text-xs text-muted-foreground">{t('access.readHasNoEffect')}</span>
      )}

      {readOnly || isOwnerRow ? (
        <span className="text-sm text-muted-foreground">{t(`access.levels.${member.level.toLowerCase()}`)}</span>
      ) : (
        <select
          value={member.level}
          onChange={(e) => onLevelChange(e.target.value as PermissionLevel)}
          className="rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground"
        >
          {!isPublic && <option value="READ">{t('access.levels.read')}</option>}
          <option value="WRITE">{t('access.levels.write')}</option>
        </select>
      )}

      {!readOnly && !isOwnerRow && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-3 py-1 text-sm font-medium text-destructive hover:bg-destructive/10"
        >
          {t('access.actions.remove')}
        </button>
      )}
    </div>
  );
}

type AssetMembersSectionProps = {
  assetKind: ManagedAssetKind;
  assetId: string;
  isOwner: boolean;
  visibility: string;
  readOnly: boolean;
};

export function AssetMembersSection({
  assetKind,
  assetId,
  isOwner,
  visibility,
  readOnly,
}: AssetMembersSectionProps) {
  const { t } = useTranslation('common');
  const { members, isLoading, isSaving, error, hasUnsavedChanges, addMember, changeLevel, removeMember, save } =
    useAssetMembers(assetKind, assetId, isOwner);

  const isPublic = visibility === 'PUBLIC';
  const [username, setUsername] = useState('');
  const [level, setLevel] = useState<PermissionLevel>(isPublic ? 'WRITE' : 'READ');

  if (!isOwner) return null;

  const handleAdd = () => {
    addMember(username, level);
    setUsername('');
  };

  const handleSave = () => {
    save();
  };

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border p-4">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('access.title')}
      </span>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('access.usernamePlaceholder')}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as PermissionLevel)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {!isPublic && <option value="READ">{t('access.levels.read')}</option>}
            <option value="WRITE">{t('access.levels.write')}</option>
          </select>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!username.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {t('access.actions.add')}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading && members.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('access.loading')}</p>
      )}

      {!isLoading && members.length === 0 && (
        <p className="text-sm text-muted-foreground">{t('access.empty')}</p>
      )}

      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <AssetMemberRow
            key={member.username}
            member={member}
            isPublic={isPublic}
            readOnly={readOnly}
            onLevelChange={(next) => changeLevel(member.username, next)}
            onRemove={() => removeMember(member.username)}
          />
        ))}
      </div>

      {!readOnly && (
        <div className="flex items-center justify-end gap-3">
          {hasUnsavedChanges && (
            <span className="text-sm text-muted-foreground">{t('access.unsavedChanges')}</span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {t('access.actions.save')}
          </button>
        </div>
      )}
    </div>
  );
}
