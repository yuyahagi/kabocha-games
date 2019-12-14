'use strict'

import * as PIXI from 'pixi.js';

class Letter extends PIXI.Text {
    constructor(text, fill = '#404040', fontSize = 48) {
        super(
            text,
            {
                fontFamily: 'Arial',
                fontSize: `${fontSize}px`,
                fontWeight: 'bold',
                align: 'center',
                fill: fill,
                strokeThickness: 3,
            });

        this.margin = 6;
    }
}

class Word extends PIXI.Container {
    constructor(text, fontSize = 48, adjustSmallLetters = true) {
        super();

        // List of auxiliary letters that attach to the normal ones.
        const a = ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'];

        let pos = 0;
        while (pos < text.length) {
            // The letter to be rendered.
            // Also append the next letter if:
            //   * This letter is a sokuon ('っ')
            //   * or the next letter is a small one (e.g., 'ゃ').
            let c = text[pos++];
            if (adjustSmallLetters) {
                if (pos < text.length && c === 'っ')
                    c += text[pos++];
                if (pos < text.length && a.includes(text[pos]))
                    c += text[pos++];
            }

            let letter = new Letter(c, '#808080', fontSize);
            letter.x = this.width == 0 ? 0 : this.width + letter.margin;
            this.addChild(letter);
        };

        this.fontSize = fontSize;
        this.cursor = 0;
    }

    getLetterAt(idx) {
        return this.children[idx];
    }

    fill(c) {
        let unfilledLetter = this.children[this.cursor];
        if (c === unfilledLetter.text) {
            let newLetter = new Letter(
                unfilledLetter.text,
                '#ffffff',
                this.fontSize);
            newLetter.x = unfilledLetter.x;
            this.removeChildAt(this.cursor);
            this.addChildAt(newLetter, this.cursor);

            this.cursor++;
            return true;
        }
        else
            return false;
    }

    get allFilled() {
        return this.cursor >= this.children.length;
    }
}

export { Letter, Word };
