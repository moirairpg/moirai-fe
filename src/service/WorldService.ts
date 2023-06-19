import store from '@/resources/store';
import webclient from '@/resources/webclient';
import World from '@/types/world/World';

const { authData } = store.getters;
const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

class WorldService {
    async getAllWorlds(requesterUserId: string): Promise<World[]> {
        try {
            const response: any = await webclient(`${baseUrl}/world`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
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
                    lorebook: world.lorebook
                },
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
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
                    lorebook: world.lorebook
                },
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response;
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
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });
        } catch (error: any) {
            console.error(`Error deleting world with id ${world.id} -> ${error}`);
            throw error;
        }
    }
}

export default new WorldService();
