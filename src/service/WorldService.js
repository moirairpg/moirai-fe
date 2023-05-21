import webclient from '../resources/webclient';
import store from '../resources/store';

const authData = store.getters.authData;
const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

export default class WorldService {
    async getAllWorlds(requesterUserId) {
        try {
            const response = await webclient(`${baseUrl}/world`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response.worlds;
        } catch (error) {
            console.error(`Error retrieving world data -> ${error}`);
            throw error;
        }
    }

    async createWorld(world, requesterUserId) {
        try {
            const response = await webclient(`${baseUrl}/world`, {
                method: 'POST',
                data: {
                    name: world.name,
                    description: world.description,
                    owner: world.owner,
                    visibility: world.visibility,
                    initial_prompt: world.initial_prompt,
                    lorebook: {
                        id: world.lorebook.id
                    }
                },
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return response.world;
        } catch (error) {
            console.error(`Error creating world -> ${error}`);
            throw error;
        }
    }

    async updateWorld(world, requesterUserId) {
        try {
            const response = await webclient(`${baseUrl}/world/${world.id}`, {
                method: 'PUT',
                data: {
                    id: world.id,
                    name: world.name,
                    description: world.description,
                    owner: world.owner,
                    visibility: world.visibility,
                    initial_prompt: world.initial_prompt,
                    lorebook: {
                        id: world.lorebook.id
                    }
                },
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response;
        } catch (error) {
            console.error(`Error updating world with id ${world.id} -> ${error}`);
            throw error;
        }
    }

    async deleteWorld(world, requesterUserId) {
        try {
            await webclient(`${baseUrl}/world/${world.id}`, {
                method: 'DELETE',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });
        } catch (error) {
            console.error(`Error deleting world with id ${world.id} -> ${error}`);
            throw error;
        }
    }
}
