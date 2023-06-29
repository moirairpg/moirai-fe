import store from '@/resources/store';
import webclient from '@/resources/webclient';
import Persona from '@/types/persona/Persona';

const { authData } = store.getters;
const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

class PersonaService {
    async getAllPersonas(requesterUserId: string): Promise<Persona[]> {
        try {
            const response: any = await webclient(`${baseUrl}/persona`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId
                }
            });

            return await response.personas;
        } catch (error: any) {
            console.error(`Error retrieving persona data -> ${error}`);
            throw error;
        }
    }

    async createPersona(persona: Persona, requesterUserId: string): Promise<Persona> {
        try {
            const response: any = await webclient(`${baseUrl}/persona`, {
                method: 'POST',
                data: {
                    id: persona.id,
                    name: persona.name,
                    intent: persona.intent,
                    personality: persona.personality,
                    owner: persona.owner,
                    visibility: persona.visibility,
                    isMultiplayer: persona.isMultiplayer,
                    nudge: persona.nudge,
                    bump: persona.bump
                },
                headers: {
                    requester: requesterUserId
                }
            });

            return response.persona;
        } catch (error: any) {
            console.error(`Error creating persona -> ${error}`);
            throw error;
        }
    }

    async updatePersona(persona: Persona, requesterUserId: string): Promise<Persona> {
        try {
            const response: any = await webclient(`${baseUrl}/persona/${persona.id}`, {
                method: 'PUT',
                data: {
                    id: persona.id,
                    name: persona.name,
                    intent: persona.intent,
                    personality: persona.personality,
                    owner: persona.owner,
                    visibility: persona.visibility,
                    isMultiplayer: persona.isMultiplayer,
                    nudge: persona.nudge,
                    bump: persona.bump
                },
                headers: {
                    requester: requesterUserId
                }
            });

            return await response;
        } catch (error: any) {
            console.error(`Error updating persona with id ${persona.id} -> ${error}`);
            throw error;
        }
    }

    async deletePersona(persona: Persona, requesterUserId: string): Promise<void> {
        try {
            await webclient(`${baseUrl}/persona/${persona.id}`, {
                method: 'DELETE',
                headers: {
                    requester: requesterUserId
                }
            });
        } catch (error: any) {
            console.error(`Error deleting persona with id ${persona.id} -> ${error}`);
            throw error;
        }
    }
}

export default new PersonaService();
