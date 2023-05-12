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

    if (decodedTokens.length > 0) {
        return {
            decodedTokens: decodedTokens,
            encodedTokens: encodedTokens,
            characters: text.length,
            tokens: encodedTokens.length,
            words: text.match(/\b(\w+)\b/g).length,
            trueColors: ['rgba(107,64,216,.3)', 'rgba(104,222,122,.4)', 'rgba(244,172,54,.4)', 'rgba(239,65,70,.4)', 'rgba(39,181,234,.4)'],
            protanopia: ['rgba(0, 93, 193, 1)', 'rgba(207, 185, 60, 1)', 'rgba(140, 130, 92, 1)', 'rgba(217, 197, 113, 1)', 'rgba(150, 165, 223, 1)'],
            deuteranopia: ['rgba(0, 99, 167, 1)', 'rgba(234, 175, 55, 1)', 'rgba(162, 123, 60, 1)', 'rgba(138, 166, 239, 1)', 'rgba(238, 188, 132, 1)'],
            tritanopia: ['rgba(68, 102, 110, 1)', 'rgba(252, 159, 171, 1)', 'rgba(0, 185, 199, 1)', 'rgba(238, 67, 70, 1)', 'rgba(133, 209, 225, 1)']
        };
    }
};

export default decodeTokens;
