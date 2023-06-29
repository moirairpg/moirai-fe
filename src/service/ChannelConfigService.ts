import store from '@/resources/store';
import webclient from '@/resources/webclient';
import ChannelConfiguration from '@/types/chconf/ChannelConfiguration';

const { authData } = store.getters;
const baseUrl = import.meta.env.VITE_CHATRPG_API_BASEURL;

class ChannelConfigService {
    async getAllChannelConfigs(requesterUserId: string): Promise<ChannelConfiguration[]> {
        try {
            const response: any = await webclient(`${baseUrl}/channel-config`, {
                method: 'GET',
                headers: {
                    requester: requesterUserId
                }
            });

            return await response.channelConfigs;
        } catch (error: any) {
            console.error(`Error retrieving channel config data -> ${error}`);
            throw error;
        }
    }

    async createChannelConfig(channelConfig: ChannelConfiguration, requesterUserId: string): Promise<ChannelConfiguration> {
        try {
            const response: any = await webclient(`${baseUrl}/channel-config`, {
                method: 'POST',
                data: {
                    id: channelConfig.id,
                    name: channelConfig.name,
                    owner: channelConfig.owner,
                    persona: {
                        id: channelConfig.persona?.id
                    },
                    world: {
                        id: channelConfig.world?.id
                    },
                    moderationSettings: {
                        id: channelConfig.moderationSettings?.id
                    },
                    modelSettings: channelConfig.modelSettings
                },
                headers: {
                    requester: requesterUserId
                }
            });

            return response.channelConfig;
        } catch (error: any) {
            console.error(`Error creating channel config -> ${error}`);
            throw error;
        }
    }

    async updateChannelConfig(channelConfig: ChannelConfiguration, requesterUserId: string): Promise<ChannelConfiguration> {
        try {
            const response: any = await webclient(`${baseUrl}/channel-config/${channelConfig.id}`, {
                method: 'PUT',
                data: {
                    id: channelConfig.id,
                    name: channelConfig.name,
                    owner: channelConfig.owner,
                    persona: {
                        id: channelConfig.persona?.id
                    },
                    world: {
                        id: channelConfig.world?.id
                    },
                    moderationSettings: {
                        id: channelConfig.moderationSettings?.id
                    },
                    modelSettings: channelConfig.modelSettings
                },
                headers: {
                    requester: requesterUserId
                }
            });

            return await response;
        } catch (error: any) {
            console.error(`Error updating channel config with id ${channelConfig.id} -> ${error}`);
            throw error;
        }
    }

    async deleteChannelConfig(channelConfig: ChannelConfiguration, requesterUserId: string): Promise<void> {
        try {
            await webclient(`${baseUrl}/channel-config/${channelConfig.id}`, {
                method: 'DELETE',
                headers: {
                    requester: requesterUserId
                }
            });
        } catch (error: any) {
            console.error(`Error deleting channel config with id ${channelConfig.id} -> ${error}`);
            throw error;
        }
    }
}

export default new ChannelConfigService();
