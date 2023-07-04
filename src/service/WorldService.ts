import store from '@/resources/store';
import webclient from '@/resources/webclient';
import LorebookEntry from '@/types/world/LorebookEntry';
import World from '@/types/world/World';

const { authData } = store.getters;
const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

class WorldService {
    async getAllWorlds(requesterUserId: string): Promise<World[]> {
        try {
            const response: any = await webclient(`${baseUrl}/world`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId
                }
            });

            return await response.worlds;
        } catch (error: any) {
            console.error(`Error retrieving world data -> ${error}`);
            throw error;
        }
    }

    async createWorld(world: World, requesterUserId: string): Promise<World> {
        try {
            const response: any = await webclient(`${baseUrl}/world`, {
                method: 'POST',
                data: {
                    id: world.id,
                    name: world.name,
                    description: world.description,
                    owner: world.owner,
                    visibility: world.visibility,
                    initial_prompt: world.initialPrompt,
                    lorebook: world.lorebook?.map((entry: LorebookEntry) => {
                        return {
                            id: entry.id ?? '',
                            name: entry.name,
                            regex: entry.regex,
                            description: entry.description
                        };
                    })
                },
                headers: {
                    requester: requesterUserId
                }
            });

            return response.world;
        } catch (error: any) {
            console.error(`Error creating world -> ${error}`);
            throw error;
        }
    }

    async updateWorld(world: World, requesterUserId: string): Promise<World> {
        try {
            const response: any = await webclient(`${baseUrl}/world/${world.id}`, {
                method: 'PUT',
                data: {
                    id: world.id,
                    name: world.name,
                    description: world.description,
                    owner: world.owner,
                    visibility: world.visibility,
                    initial_prompt: world.initialPrompt,
                    lorebook: world.lorebook?.map((entry: LorebookEntry) => {
                        return {
                            id: entry.id ?? '',
                            name: entry.name,
                            regex: entry.regex,
                            description: entry.description
                        };
                    })
                },
                headers: {
                    requester: requesterUserId
                }
            });

            return await response.world;
        } catch (error: any) {
            console.error(`Error updating world with id ${world.id} -> ${error}`);
            throw error;
        }
    }

    async deleteWorld(world: World, requesterUserId: string): Promise<void> {
        try {
            await webclient(`${baseUrl}/world/${world.id}`, {
                method: 'DELETE',
                headers: {
                    requester: requesterUserId
                }
            });
        } catch (error: any) {
            console.error(`Error deleting world with id ${world.id} -> ${error}`);
            throw error;
        }
    }
}

export default new WorldService();
