import axios from 'axios';
import store from '../store';

const authData = store.getters.authData;
const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

export default class LorebookService {
    /* LOREBOOK */
    async getAllLorebooks(requesterUserId) {
        try {
            const response = await axios(`${baseUrl}/lore/book`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response.data.lorebooks;
        } catch (error) {
            console.error(`Error retrieving lorebook data -> ${error}`);
            throw error;
        }
    }

    async createLorebook(lorebook, requesterUserId) {
        try {
            delete lorebook.canEdit;
            const newLorebook = await axios(`${baseUrl}/lore/book`, {
                method: 'POST',
                data: lorebook,
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return newLorebook.data.lorebook;
        } catch (error) {
            console.error(`Error creating lorebook -> ${error}`);
            throw error;
        }
    }

    async updateLorebook(lorebook, requesterUserId) {
        try {
            delete lorebook.canEdit;
            delete lorebook.ownerData;
            const response = await axios(`${baseUrl}/lore/book/${lorebook.id}`, {
                method: 'PUT',
                data: lorebook,
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response.data;
        } catch (error) {
            console.error(`Error updating lorebook with id ${lorebook.id} -> ${JSON.stringify(error, null, 2)}`);
            throw error;
        }
    }

    async deleteLorebook(lorebook, requesterUserId) {
        try {
            await axios(`${baseUrl}/lore/book/${lorebook.id}`, {
                method: 'DELETE',
                data: lorebook,
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
            const response = await axios(`${baseUrl}/lore/entry/lorebook/${lorebook.id}`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response.data.lorebook_entries;
        } catch (error) {
            console.error(`Error retrieving lorebook data from lorebook with id ${lorebook.id} -> ${error}`);
            throw error;
        }
    }

    async createLorebookEntry(entry, lorebook, requesterUserId) {
        try {
            const response = await axios(`${baseUrl}/lore/entry/${lorebook.id}`, {
                method: 'POST',
                data: entry,
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return response.data.lorebook_entry;
        } catch (error) {
            console.error(`Error creating lorebook entry with id ${entry.id} -> ${error}`);
            throw error;
        }
    }

    async updateLorebookEntry(entry, requesterUserId) {
        try {
            const response = await axios(`${baseUrl}/lore/entry/${entry.id}`, {
                method: 'PUT',
                data: entry,
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return response.data;
        } catch (error) {
            console.error(`Error updating lorebook entry with id ${entry.id} -> ${error}`);
            throw error;
        }
    }

    async deleteLorebookEntry(entry, requesterUserId) {
        try {
            await axios.delete(`${baseUrl}/lore/entry/${entry.id}`, {
                method: 'DELETE',
                data: entry,
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
