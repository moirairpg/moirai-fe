import { encode, decodeGenerator } from 'gpt-tokenizer';

let encodedTokens = null;
let decodedTokens = [];

const decodeTokens = (event) => {
    decodedTokens = [];
    let text = event.target.value;
    encodedTokens = encode(text);

    for (const token of decodeGenerator(encodedTokens)) {
        decodedTokens.push(String(token).replaceAll(' ', '\u00A0').replaceAll('\n', '<newline>'));
    }

    console.log(`Array -> ${decodedTokens}`)
    if (decodedTokens.length > 0) {
        return {
            decodedTokens: decodedTokens,
            encodedTokens: encodedTokens,
            characters: text.length,
            tokens: encodedTokens.length,
            words: text.match(/\b(\w+)\b/g).length
        };
    }
};

export default decodeTokens;
