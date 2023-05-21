import webclient from '../resources/webclient';
import store from '../resources/store';

const authData = store.getters.authData;
const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

export default class LorebookService {
    /* LOREBOOK */
    async getAllLorebooks(requesterUserId) {
        try {
            const response = await webclient(`${baseUrl}/lore/book`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response.lorebooks;
        } catch (error) {
            console.error(`Error retrieving lorebook data -> ${error}`);
            throw error;
        }
    }

    async createLorebook(lorebook, requesterUserId) {
        try {
            const response = await webclient(`${baseUrl}/lore/book`, {
                method: 'POST',
                data: {
                    name: lorebook.name,
                    description: lorebook.description,
                    owner: lorebook.owner,
                    visibility: lorebook.visibility,
                    entries: lorebook.entries
                },
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return response.lorebook;
        } catch (error) {
            console.error(`Error creating lorebook -> ${error}`);
            throw error;
        }
    }

    async updateLorebook(lorebook, requesterUserId) {
        try {
            const response = await webclient(`${baseUrl}/lore/book/${lorebook.id}`, {
                method: 'PUT',
                data: {
                    id: lorebook.id,
                    name: lorebook.name,
                    description: lorebook.description,
                    owner: lorebook.owner,
                    visibility: lorebook.visibility,
                    entries: lorebook.entries
                },
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response;
        } catch (error) {
            console.error(`Error updating lorebook with id ${lorebook.id} -> ${JSON.stringify(error, null, 2)}`);
            throw error;
        }
    }

    async deleteLorebook(lorebook, requesterUserId) {
        try {
            await webclient(`${baseUrl}/lore/book/${lorebook.id}`, {
                method: 'DELETE',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });
        } catch (error) {
            console.error(`Error deleting lorebook with id ${lorebook.id} -> ${error}`);
            throw error;
        }
    }

    /* LOREBOOK ENTRIES */
    async getAllEntriesFromLorebook(lorebook) {
        try {
            const response = await webclient(`${baseUrl}/lore/entry/lorebook/${lorebook.id}`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response.lorebook_entries;
        } catch (error) {
            console.error(`Error retrieving lorebook data from lorebook with id ${lorebook.id} -> ${error}`);
            throw error;
        }
    }

    async createLorebookEntry(entry, lorebook, requesterUserId) {
        try {
            const response = await webclient(`${baseUrl}/lore/entry/${lorebook.id}`, {
                method: 'POST',
                data: {
                    id: entry.id,
                    name: entry.name,
                    description: entry.description,
                    regex: entry.regex
                },
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return response.lorebook_entry;
        } catch (error) {
            console.error(`Error creating lorebook entry with id ${entry.id} -> ${error}`);
            throw error;
        }
    }

    async updateLorebookEntry(entry, requesterUserId) {
        try {
            const response = await webclient(`${baseUrl}/lore/entry/${entry.id}`, {
                method: 'PUT',
                data: {
                    id: entry.id,
                    name: entry.name,
                    description: entry.description,
                    regex: entry.regex
                },
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return response;
        } catch (error) {
            console.error(`Error updating lorebook entry with id ${entry.id} -> ${error}`);
            throw error;
        }
    }

    async deleteLorebookEntry(entry, requesterUserId) {
        try {
            await webclient(`${baseUrl}/lore/entry/${entry.id}`, {
                method: 'DELETE',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });
        } catch (error) {
            console.error(`Error deleting lorebook entry with id ${entry.id} -> ${error}`);
            throw error;
        }
    }
}
