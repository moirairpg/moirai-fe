import axios from 'axios';
import store from '../store';

const authData = store.getters.authData;
const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

export default class PersonaService {
    async getAllPersonas(requesterUserId) {
        try {
            const response = await axios(`${baseUrl}/persona`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response.data.personas;
        } catch (error) {
            console.error(`Error retrieving persona data -> ${error}`);
            throw error;
        }
    }

    async createPersona(persona, requesterUserId) {
        try {
            const newPersona = await axios(`${baseUrl}/persona`, {
                method: 'POST',
                data: persona,
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return newPersona.data.persona;
        } catch (error) {
            console.error(`Error creating persona -> ${error}`);
            throw error;
        }
    }

    async updatePersona(persona, requesterUserId) {
        try {
            delete persona.ownerData;
            const response = await axios(`${baseUrl}/persona/${persona.id}`, {
                method: 'PUT',
                data: persona,
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response.data;
        } catch (error) {
            console.error(`Error updating persona with id ${persona.id} -> ${error}`);
            throw error;
        }
    }

    async deletePersona(persona, requesterUserId) {
        try {
            await axios(`${baseUrl}/persona/${persona.id}`, {
                method: 'DELETE',
                data: persona,
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });
        } catch (error) {
            console.error(`Error deleting persona with id ${persona.id} -> ${error}`);
            throw error;
        }
    }
}
