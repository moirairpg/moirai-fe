import axios from 'axios'

const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

export default class LorebookService {

    /* LOREBOOK */
    async getAllLorebooks() {
        try {
            const response = await axios.get(`${baseUrl}/lore/book`)
            return await response.data.lorebooks
        } catch (error) {
            console.error(`Error retrieving lorebook data -> ${error}`)
            throw error
        }
    }

    async createLorebook(lorebook) {
        try {
            const newLorebook = await axios.post(`${baseUrl}/lore/book`, lorebook)
            return newLorebook.data.lorebook
        } catch (error) {
            console.error(`Error creating lorebook -> ${error}`)
            throw error
        }
    }

    async updateLorebook(lorebook) {
        try {
            delete lorebook.ownerData;
            const response = await axios.put(`${baseUrl}/lore/book/${lorebook.id}`, lorebook)
            return await response.data
        } catch (error) {
            console.error(`Error updating lorebook with id ${lorebook.id} -> ${JSON.stringify(error, null, 2)}`)
            throw error
        }
    }

    async deleteLorebook(lorebook) {
        try {
            await axios.delete(`${baseUrl}/lore/book/${lorebook.id}`, lorebook)
        } catch (error) {
            console.error(`Error deleting lorebook with id ${lorebook.id} -> ${error}`)
            throw error
        }
    }

    /* LOREBOOK ENTRIES */
    async getAllEntriesFromLorebook(lorebook) {
        try {
            const response = await axios.get(`${baseUrl}/lore/entry/lorebook/${lorebook.id}`)
            return await response.data.lorebook_entries
        } catch (error) {
            console.error(`Error retrieving lorebook data from lorebook with id ${lorebook.id} -> ${error}`)
            throw error
        }
    }

    async createLorebookEntry(entry, lorebook) {
        try {
            const response = await axios.post(`${baseUrl}/lore/entry/${lorebook.id}`, entry)
            return response.data.lorebook_entry
        } catch (error) {
            console.error(`Error creating lorebook entry with id ${entry.id} -> ${error}`)
            throw error
        }
    }

    async updateLorebookEntry(entry) {
        try {
            const response = await axios.put(`${baseUrl}/lore/entry/${entry.id}`, entry)
            return response.data
        } catch (error) {
            console.error(`Error updating lorebook entry with id ${entry.id} -> ${error}`)
            throw error
        }
    }

    async deleteLorebookEntry(entry) {
        try {
            await axios.delete(`${baseUrl}/lore/entry/${entry.id}`, entry)
        } catch (error) {
            console.error(`Error deleting lorebook entry with id ${entry.id} -> ${error}`)
            throw error
        }
    }
}