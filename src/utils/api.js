const apiFetch = (url, options = {}) =>
  fetch(url, { ...options, credentials: 'include' });

export { apiFetch };

export const extractApiError = async (res) => {
  try {
    const data = await res.json();
    const parts = [];
    if (data.message) parts.push(data.message);
    if (Array.isArray(data.details) && data.details.length > 0) parts.push(data.details.join(', '));
    return parts.length > 0 ? parts.join(' — ') : null;
  } catch {
    return null;
  }
};

export const api = {
  auth: {
    user: () => apiFetch('/api/auth/user'),
    refresh: () => apiFetch('/api/auth/refresh', { method: 'POST' }),
    logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  },
  imageGenerations: {
    generate: async (prompt) => {
      const res = await apiFetch('/api/image-generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error('Image generation failed');
      return res.blob();
    },
  },
  world: {
    uploadImage: (id, file) => {
      const form = new FormData();
      form.append('file', file);
      return apiFetch(`/api/worlds/${id}/image`, { method: 'PUT', body: form });
    },
    removeImage: (id) =>
      apiFetch(`/api/worlds/${id}/image`, { method: 'DELETE' }),
  },
  adventure: {
    uploadImage: (id, file) => {
      const form = new FormData();
      form.append('file', file);
      return apiFetch(`/api/adventures/${id}/image`, { method: 'PUT', body: form });
    },
    removeImage: (id) =>
      apiFetch(`/api/adventures/${id}/image`, { method: 'DELETE' }),
    invite: (adventureId, usernames) =>
      apiFetch(`/api/adventures/${adventureId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames }),
      }),
    removeCharacter: (adventureId, playerCharacterId) =>
      apiFetch(`/api/adventures/${adventureId}/characters/${playerCharacterId}`, { method: 'DELETE' }),
  },
  adventureInvitations: {
    join: (invitationId, playerCharacterId) =>
      apiFetch(`/api/adventures/invitations/${invitationId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerCharacterId }),
      }),
    decline: (invitationId) =>
      apiFetch(`/api/adventures/invitations/${invitationId}/decline`, { method: 'POST' }),
  },
  character: {
    search: (name) =>
      apiFetch(`/api/player-characters/search?name=${encodeURIComponent(name ?? '')}`),
    uploadImage: (id, file) => {
      const form = new FormData();
      form.append('file', file);
      return apiFetch(`/api/player-characters/${id}/image`, { method: 'PUT', body: form });
    },
    removeImage: (id) =>
      apiFetch(`/api/player-characters/${id}/image`, { method: 'DELETE' }),
  },
};
