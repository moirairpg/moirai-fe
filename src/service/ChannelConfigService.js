import webclient from '../resources/webclient';
import store from '../resources/store';

const { authData } = store.getters;
const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

export default class ChannelConfigService {
    async getAllChannelConfigs(requesterUserId) {
        try {
            const response = await webclient(`${baseUrl}/channel-config`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response.channel_configs;
        } catch (error) {
            console.error(`Error retrieving channel config data -> ${error}`);
            throw error;
        }
    }

    async createChannelConfig(channelConfig, requesterUserId) {
        try {
            const response = await webclient(`${baseUrl}/channel-config`, {
                method: 'POST',
                data: {
                    id: channelConfig.id,
                    name: channelConfig.name,
                    owner: channelConfig.owner,
                    persona: {
                        id: channelConfig.persona.id
                    },
                    world: {
                        id: channelConfig.world.id
                    },
                    moderation_settings: {
                        id: channelConfig.moderation_settings.id
                    },
                    model_settings: channelConfig.model_settings
                },
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return response.channel_config;
        } catch (error) {
            console.error(`Error creating channel config -> ${error}`);
            throw error;
        }
    }

    async updateChannelConfig(channelConfig, requesterUserId) {
        try {
            const response = await webclient(`${baseUrl}/channel-config/${channelConfig.id}`, {
                method: 'PUT',
                data: {
                    id: channelConfig.id,
                    name: channelConfig.name,
                    owner: channelConfig.owner,
                    persona: {
                        id: channelConfig.persona.id
                    },
                    world: {
                        id: channelConfig.world.id
                    },
                    moderation_settings: {
                        id: channelConfig.moderation_settings.id
                    },
                    model_settings: channelConfig.model_settings
                },
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });

            return await response;
        } catch (error) {
            console.error(`Error updating channel config with id ${channelConfig.id} -> ${error}`);
            throw error;
        }
    }

    async deleteChannelConfig(channelConfig, requesterUserId) {
        try {
            await webclient(`${baseUrl}/channel-config/${channelConfig.id}`, {
                method: 'DELETE',
                headers: {
                    requester: requesterUserId,
                    Authorization: `Bearer ${authData.access_token}`
                }
            });
        } catch (error) {
            console.error(`Error deleting channel config with id ${channelConfig.id} -> ${error}`);
            throw error;
        }
    }
}
