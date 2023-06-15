import LogitBias from '@/types/chconf/LogitBias';
import LabelItem from '../LabelItem';

export default interface ModelSettings {
    id?: string;
    modelName?: string | LabelItem;
    maxTokens?: number;
    chatHistoryMemory?: number;
    temperature?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequence?: string[];
    logitBias?: LogitBias[];
}
