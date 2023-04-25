import axios from 'axios';
import store from '../resources/store';

const authData = store.getters.authData;
const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

export default class WorldService {
    async getAllWorlds(requesterUserId) {
        try {
            const response = await axios(`${baseUrl}/world`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response.data.worlds;
        } catch (error) {
            console.error(`Error retrieving world data -> ${error}`);
            throw error;
        }
    }

    async createWorld(world, requesterUserId) {
        try {
            delete world.lorebook.ownerData;
            const newWorld = await axios(`${baseUrl}/world`, {
                method: 'POST',
                data: world,
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return newWorld.data.world;
        } catch (error) {
            console.error(`Error creating world -> ${error}`);
            throw error;
        }
    }

    async updateWorld(world, requesterUserId) {
        try {
            delete world.ownerData;
            delete world.lorebook.ownerData;
            const response = await axios(`${baseUrl}/world/${world.id}`, {
                method: 'PUT',
                data: world,
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response.data;
        } catch (error) {
            console.error(`Error updating world with id ${world.id} -> ${error}`);
            throw error;
        }
    }

    async deleteWorld(world, requesterUserId) {
        try {
            await axios(`${baseUrl}/world/${world.id}`, {
                method: 'DELETE',
                data: world,
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
