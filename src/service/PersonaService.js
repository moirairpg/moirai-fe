import axios from 'axios'

const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

export default class PersonaService {

    async getAllPersonas() {
        try {
            const response = await axios.get(`${baseUrl}/persona`)
            return await response.data.personas
        } catch (error) {
            console.error(`Error retrieving persona data -> ${error}`)
            throw error
        }
    }

    async createPersona(persona) {
        try {
            const newPersona = await axios.post(`${baseUrl}/persona`, persona)
            return newPersona.data.persona
        } catch (error) {
            console.error(`Error creating persona -> ${error}`)
            throw error
        }
    }

    async updatePersona(persona) {
        try {
            delete persona.ownerData;
            const response = await axios.put(`${baseUrl}/persona/${persona.id}`, persona)
            return await response.data
        } catch (error) {
            console.error(`Error updating persona with id ${persona.id} -> ${error}`)
            throw error
        }
    }

    async deletePersona(persona) {
        try {
            await axios.delete(`${baseUrl}/persona/${persona.id}`, persona)
        } catch (error) {
            console.error(`Error deleting persona with id ${persona.id} -> ${error}`)
            throw error
        }
    }
}