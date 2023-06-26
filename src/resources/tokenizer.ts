import TokenProps from '@/types/TokenProps';
import { decodeGenerator, decodeToken, encode } from 'gpt-tokenizer';

export const decodeTokens = (text: string): TokenProps => {
    let decodedTokens = [];
    let encodedTokens = encode(text);

    for (const token of decodeGenerator(encodedTokens)) {
        decodedTokens.push(String(token).replaceAll(' ', '\u00A0').replaceAll('\n', '<newline>'));
    }

    if (decodedTokens.length > 0) {
        return {
            decodedTokens,
            encodedTokens,
            characters: text.length,
            tokens: encodedTokens.length,
            words: text.match(/\b(\w+)\b/g)?.length ?? 0
        };
    }

    return {};
};

export const decodeSingleToken = (tokenId: number): string => {
    return decodeToken(tokenId);
};
