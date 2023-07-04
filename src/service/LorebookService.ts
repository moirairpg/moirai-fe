import store from '@/resources/store';
import webclient from '@/resources/webclient';
import LorebookEntry from '@/types/world/LorebookEntry';
import World from '@/types/world/World';

const { authData } = store.getters;
const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

class LorebookService {
    async createLorebookEntry(entry: LorebookEntry, world: World, requesterUserId: string): Promise<LorebookEntry> {
        try {
            const response: any = await webclient(`${baseUrl}/lore/entry/${world.id}`, {
                method: 'POST',
                data: {
                    id: entry.id,
                    name: entry.name,
                    description: entry.description,
                    regex: entry.regex
                },
                headers: {
                    requester: requesterUserId
                }
            });

            return response.lorebook_entry;
        } catch (error: any) {
            console.error(`Error creating lorebook entry with id ${entry.id} -> ${error}`);
            throw error;
        }
    }

    async updateLorebookEntry(entry: LorebookEntry, requesterUserId: string): Promise<LorebookEntry> {
        try {
            const response: any = await webclient(`${baseUrl}/lore/entry/${entry.id}`, {
                method: 'PUT',
                data: {
                    id: entry.id,
                    name: entry.name,
                    description: entry.description,
                    regex: entry.regex
                },
                headers: {
                    requester: requesterUserId
                }
            });

            return response;
        } catch (error: any) {
            console.error(`Error updating lorebook entry with id ${entry.id} -> ${error}`);
            throw error;
        }
    }

    async deleteLorebookEntry(entry: LorebookEntry, requesterUserId: string): Promise<void> {
        try {
            await webclient(`${baseUrl}/lore/entry/${entry.id}`, {
                method: 'DELETE',
                headers: {
                    requester: requesterUserId
                }
            });
        } catch (error: any) {
            console.error(`Error deleting lorebook entry with id ${entry.id} -> ${error}`);
            throw error;
        }
    }
}

export default new LorebookService();
