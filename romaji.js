'use strict'

const consonants = [
    'K', 'G', 'S', 'Z', 'T', 'D', 'N', 'H', 'B', 'P', 'M', 'Y', 'R', 'W'
];
const vowels = [
    'A', 'I', 'U', 'E', 'O'
];
const romajis = new Map([
    ['A', 'あ'],
    ['I', 'い'],
    ['U', 'う'],
    ['E', 'え'],
    ['O', 'お'],
    ['KA', 'か'],
    ['KI', 'き'],
    ['KU', 'く'],
    ['KE', 'け'],
    ['KO', 'こ'],
    ['GA', 'が'],
    ['GI', 'ぎ'],
    ['GU', 'ぐ'],
    ['GE', 'げ'],
    ['GO', 'ご'],
    ['SA', 'さ'],
    ['SI', 'し'],
    ['SU', 'す'],
    ['SE', 'せ'],
    ['SO', 'そ'],
    ['ZA', 'ざ'],
    ['ZI', 'じ'],
    ['ZU', 'ず'],
    ['ZE', 'ぜ'],
    ['ZO', 'ぞ'],
    ['TA', 'た'],
    ['TI', 'ち'],
    ['TU', 'つ'],
    ['TE', 'て'],
    ['TO', 'と'],
    ['DA', 'だ'],
    ['DI', 'ぢ'],
    ['DU', 'づ'],
    ['DE', 'で'],
    ['DO', 'ど'],
    ['NA', 'な'],
    ['NI', 'に'],
    ['NU', 'ぬ'],
    ['NE', 'ね'],
    ['NO', 'の'],
    ['HA', 'は'],
    ['HI', 'ひ'],
    ['HU', 'ふ'],
    ['HE', 'へ'],
    ['HO', 'ほ'],
    ['BA', 'ば'],
    ['BI', 'び'],
    ['BU', 'ぶ'],
    ['BE', 'べ'],
    ['BO', 'ぼ'],
    ['PA', 'ぱ'],
    ['PI', 'ぴ'],
    ['PU', 'ぷ'],
    ['PE', 'ぺ'],
    ['PO', 'ぽ'],
    ['MA', 'ま'],
    ['MI', 'み'],
    ['MU', 'む'],
    ['ME', 'め'],
    ['MO', 'も'],
    ['YA', 'や'],
    ['YU', 'ゆ'],
    ['YO', 'よ'],
    ['RA', 'ら'],
    ['RI', 'り'],
    ['RU', 'る'],
    ['RE', 'れ'],
    ['RO', 'ろ'],
    ['WA', 'わ'],
    ['WO', 'を'],
    ['NN', 'ん'],
]);

let lastFoundConsonant = '';

function parseTextIntoKana(text, startIndex) {
    let pos = startIndex;
    let vowel = null;
    let found = false;
    while (!found && pos < text.length) {
        if (vowels.includes(text[pos])) {
            found = true;
            vowel = text[pos];
        }
        if (consonants.includes(text[pos])) {
            lastFoundConsonant = text[pos];
        }
        ++pos;
    }

    const kana = found ? romajis.get(lastFoundConsonant + vowel) : null;

    // Clear consonant.
    if (found) {
        lastFoundConsonant = '';
    }

    return {
        kana: kana,
        nextIndex: pos,
    };
}
