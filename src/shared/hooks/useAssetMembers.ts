import { useCallback, useEffect, useState } from 'react';
import { api, extractApiError } from '../../utils/api';
import type { AssetMemberDraft, ManagedAssetKind, PermissionLevel } from '../types/permissions';

const signatureOf = (members: AssetMemberDraft[]) =>
  members
    .map((member) => `${member.username}:${member.level}`)
    .sort()
    .join('|');

export function useAssetMembers(assetKind: ManagedAssetKind, assetId: string | undefined, enabled: boolean) {
  const [savedMembers, setSavedMembers] = useState<AssetMemberDraft[]>([]);
  const [members, setMembers] = useState<AssetMemberDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!assetId || !enabled) return;
    setIsLoading(true);

    try {
      const res = await api.assetPermissions.list(assetKind, assetId);
      if (!res.ok) return;

      const loaded: AssetMemberDraft[] = await res.json();

      setSavedMembers(loaded);
      setMembers(loaded);
    } finally {
      setIsLoading(false);
    }
  }, [assetKind, assetId, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasUnsavedChanges = signatureOf(members) !== signatureOf(savedMembers);

  const addMember = (username: string, level: PermissionLevel) => {
    const trimmed = username.trim();
    if (!trimmed) return;

    setMembers((current) => {
      if (current.some((member) => member.username === trimmed && member.level === 'OWNER')) return current;

      return [
        ...current.filter((member) => member.username !== trimmed),
        { userId: null, username: trimmed, level },
      ];
    });
  };

  const changeLevel = (username: string, level: PermissionLevel) => {
    setMembers((current) =>
      current.map((member) =>
        member.username === username && member.level !== 'OWNER' ? { ...member, level } : member,
      ),
    );
  };

  const removeMember = (username: string) => {
    setMembers((current) =>
      current.filter((member) => member.username !== username || member.level === 'OWNER'),
    );
  };

  const save = async (visibility: string) => {
    if (!assetId) return false;
    setError('');
    setIsSaving(true);

    const payload = members
      .filter((member) => member.level !== 'OWNER')
      .map((member) => ({ username: member.username, level: member.level }));

    try {
      const res = await api.assetPermissions.save(assetKind, assetId, visibility, payload, { silent: true });

      if (!res.ok) {
        setError((await extractApiError(res)) ?? '');
        return false;
      }

      const saved: AssetMemberDraft[] = await res.json();

      setSavedMembers(saved);
      setMembers(saved);

      return true;
    } finally {
      setIsSaving(false);
    }
  };

  return { members, isLoading, isSaving, error, hasUnsavedChanges, addMember, changeLevel, removeMember, save };
}
