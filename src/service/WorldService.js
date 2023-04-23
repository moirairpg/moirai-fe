import axios from 'axios'

const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

export default class WorldService {

    async getAllWorlds() {
        try {
            const response = await axios.get(`${baseUrl}/world`)
            return await response.data.worlds
        } catch (error) {
            console.error(`Error retrieving world data -> ${error}`)
            throw error
        }
    }

    async createWorld(world) {
        try {
            delete world.lorebook.ownerData;
            const newWorld = await axios.post(`${baseUrl}/world`, world)
            return newWorld.data.world
        } catch (error) {
            console.error(`Error creating world -> ${error}`)
            throw error
        }
    }

    async updateWorld(world) {
        try {
            delete world.ownerData;
            delete world.lorebook.ownerData;
            const response = await axios.put(`${baseUrl}/world/${world.id}`, world)
            return await response.data
        } catch (error) {
            console.error(`Error updating world with id ${world.id} -> ${error}`)
            throw error
        }
    }

    async deleteWorld(world) {
        try {
            await axios.delete(`${baseUrl}/world/${world.id}`, world)
        } catch (error) {
            console.error(`Error deleting world with id ${world.id} -> ${error}`)
            throw error
        }
    }
}