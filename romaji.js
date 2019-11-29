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

class Romaji {
    constructor() {
        this.characters = '';
        this.parsed = null;
        this.finalized = false;
    }

    clear() {
        this.characters = '';
        this.parsed = null;
        this.finalized = false;
    }

    append(c) {
        // c: 'A'-'Z'

        // In case additional characters are appended, clear state and start over.
        if (this.finalized) {
            this.clear();
        }
        
        this.characters += c;
        this.parsed = romajis.get(this.characters);
        if (this.parsed) {
            this.finalized = true;
        }
        else if (this.characters.length >= 2) {
            this.finalized = true;
            this.parsed = null;
        }
    }
}
