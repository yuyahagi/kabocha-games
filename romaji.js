'use strict'

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
    ['SHI', 'し'],
    ['SU', 'す'],
    ['SE', 'せ'],
    ['SO', 'そ'],
    ['ZA', 'ざ'],
    ['ZI', 'じ'],
    ['JI', 'じ'],
    ['ZU', 'ず'],
    ['ZE', 'ぜ'],
    ['ZO', 'ぞ'],
    ['TA', 'た'],
    ['TI', 'ち'],
    ['CHI', 'ち'],
    ['TU', 'つ'],
    ['TSU', 'つ'],
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
    ['FU', 'ふ'],
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
    ['YE', 'いぇ'],
    ['YO', 'よ'],
    ['RA', 'ら'],
    ['RI', 'り'],
    ['RU', 'る'],
    ['RE', 'れ'],
    ['LO', 'ろ'],
    ['LA', 'ら'],
    ['LI', 'り'],
    ['LU', 'る'],
    ['LE', 'れ'],
    ['LO', 'ろ'],
    ['WA', 'わ'],
    ['WI', 'うぃ'],
    ['WE', 'うぇ'],
    ['WO', 'を'],
    ['NN', 'ん'],
    ['KYA', 'きゃ'],
    ['KYU', 'きゅ'],
    ['KYE', 'きぇ'],
    ['KYO', 'きょ'],
    ['SYA', 'しゃ'],
    ['SYU', 'しゅ'],
    ['SYE', 'しぇ'],
    ['SYO', 'しょ'],
    ['SHA', 'しゃ'],
    ['SHU', 'しゅ'],
    ['SHE', 'しぇ'],
    ['SHO', 'しょ'],
    ['TYA', 'ちゃ'],
    ['TYU', 'ちゅ'],
    ['TYE', 'ちぇ'],
    ['TYO', 'ちょ'],
    ['CHA', 'ちゃ'],
    ['CHU', 'ちゅ'],
    ['CHE', 'ちぇ'],
    ['CHO', 'ちょ'],
    ['THA', 'てゃ'],
    ['THI', 'てぃ'],
    ['THU', 'てゅ'],
    ['THE', 'てぇ'],
    ['THO', 'てょ'],
    ['DHA', 'でゃ'],
    ['DHI', 'でぃ'],
    ['DHU', 'でゅ'],
    ['DHE', 'でぇ'],
    ['DHO', 'でょ'],
    ['NYA', 'にゃ'],
    ['NYU', 'にゅ'],
    ['NYE', 'にぇ'],
    ['NYO', 'にょ'],
    ['HYA', 'ひゃ'],
    ['HYU', 'ひゅ'],
    ['HYE', 'ひぇ'],
    ['HYO', 'ひょ'],
    ['FA', 'ふぁ'],
    ['FI', 'ふぃ'],
    ['FE', 'ふぇ'],
    ['FO', 'ふぉ'],
    ['MYA', 'みゃ'],
    ['MYU', 'みゅ'],
    ['MYE', 'みぇ'],
    ['MYO', 'みょ'],
    ['RYA', 'りゃ'],
    ['RYU', 'りゅ'],
    ['RYE', 'りぇ'],
    ['RYO', 'りょ'],
    ['LYA', 'りゃ'],
    ['LYU', 'りゅ'],
    ['LYE', 'りぇ'],
    ['LYO', 'りょ'],
    ['GYA', 'ぎゃ'],
    ['GYU', 'ぎゅ'],
    ['GYE', 'ぎぇ'],
    ['GYO', 'ぎょ'],
    ['JA', 'じゃ'],
    ['JU', 'じゅ'],
    ['JE', 'じぇ'],
    ['JO', 'じょ'],
    ['DYA', 'ぢゃ'],
    ['DYU', 'ぢゅ'],
    ['DYE', 'ぢぇ'],
    ['DYO', 'ぢょ'],
    ['BYA', 'びゃ'],
    ['BYU', 'びゅ'],
    ['BYE', 'びぇ'],
    ['BYO', 'びょ'],
    ['PYA', 'ぴゃ'],
    ['PYU', 'ぴゅ'],
    ['PYE', 'ぴぇ'],
    ['PYO', 'ぴょ'],
]);

// Extend intermediary romaji inputs.
let romajiIntermediary = new Map;
for (var [key, value] of romajis.entries()) {
    for (let i = 1; i < key.length; i++) {
        romajiIntermediary.set(key.slice(0, i), '');
    }
    romajiIntermediary.set(key, value);
}

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

        // Remove the input characters in the FIFO manner until parsing
        // becomes possible.
        while (this.characters.length > 0 && !romajiIntermediary.has(this.characters)) {
            this.characters = this.characters.slice(1);
        };

        this.parsed = romajiIntermediary.get(this.characters);
        if (this.parsed == null) {
            this.finalized = false;
            this.parsed = null;
        }
        else if (this.parsed === '') {
            this.finalized = false;
            this.parsed = null;
        }
        else {
            this.finalized = true;
        }
    }
}
