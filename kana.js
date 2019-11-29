'use strict'

const problems = [
    'いか',
    'たこ',
    'あか',
    'がく',
    'のり',
    'もも',
    'はな',
    'まま',
    'むし',
    'おなか',
    'みどり',
    'さかな',
    'かえる',
    'おにぎり',
    'うみのいきもの',
];

let app;
let input;
let typing;
let state = play;
let letters;
let fallingLetters = [];

class Letter extends PIXI.Text {
    constructor(text, fill = '#404040', stroke = '#606060') {
        super(
            text,
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                fontWeight: 'bold',
                align: 'center',
                fill: fill,
                stroke: stroke,
                strokeThickness: 3,
            });
        
        this.margin = 12;
    }
}

class Word extends PIXI.Container {
    constructor(text) {
        super();
        for (let i = 0; i < text.length; i++) {
            let letter = new Letter(text[i], '#404040', '#606060');
            letter.x = this.width == 0 ? 0 : this.width + letter.margin;
            this.addChild(letter);
        };
        this.cursor = 0;
    }

    getLetterAt(idx) {
        return this.children[idx];
    }

    fill(c) {
        let unfilledLetter = this.children[this.cursor];
        if (c === unfilledLetter.text) {
            let newLetter = new Letter(unfilledLetter.text, '#ffffff', '#000000');
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

function initScreen() {
    app = new PIXI.Application({ width: 640, height: 480 });
    app.loader
        .load(setup);
    
    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup(loader, resources) {
    input = new PlayerInput();
    initPlay();
    app.ticker.add(delta => gameLoop(delta));
}

let problemIndex = 0;
function initPlay() {
    if (letters) {
        app.stage.removeChild(letters);
    }

    letters = new Word(problems[problemIndex]);
    problemIndex = (problemIndex + 1) % problems.length;
    letters.pivot.set(
        letters.width / 2,
        letters.height / 2);
    letters.position.set(
        app.screen.width / 2,
        app.screen.height / 2);
    app.stage.addChild(letters);

    if (typing) typing.unsubscribe();
    typing = new TypingInput();

    state = play;
}

function fillLetter(index, c) {
    let newLetter = new Letter(c, '#ffffff', '#000000')
    newLetter.x = 0;//letters.width == 0 ? 0 : letters.width + newLetter.margin;
    letters.addChild(newLetter);

    letters.position.set(
        app.screen.width / 2 - letters.width / 2,
        app.screen.height / 2 - letters.height / 2);
}

function moveFallingLetters() {
    for (var i = fallingLetters.length - 1; i >= 0; i--) {
        let l = fallingLetters[i];
        l.x += l.dx;
        l.y += l.dy;
        l.dy += 0.2;
        l.rotation += l.omega;
        if (l.y > app.screen.height) {
            fallingLetters.splice(i, 1);
            app.stage.removeChild(l);
        }
    }
}

function gameLoop(delta) {
    state(delta);
}

function play(delta) {
    const inputs = typing.getPressedKeys();
    if (inputs.length > 0) {
        let pos = 0;
        // If you type fast, there may be multiple keypresses.
        // Process all of them until all letters in the problem
        // have been filled.
        for (let i = 0; !letters.allFilled && i < inputs.length; i++) {
            const parsed = parseTextIntoKana(inputs, pos);
            const nextInput = parsed.kana;
            pos = parsed.nextIndex;
            const filled = letters.fill(nextInput);
            
            if (!filled) {
                const correctLetter = letters.getLetterAt(letters.cursor);
                let startingPosition = correctLetter.parent.toGlobal(correctLetter.position);
                startingPosition.x += correctLetter.width / 2;
                startingPosition.y += correctLetter.height / 2;

                let l = new Letter(nextInput, '#ffffff', '#000000');
                l.x = startingPosition.x;
                l.y = startingPosition.y;
                l.anchor.set(0.5);
                l.dy = -1;
                l.dx = 0 * (Math.random() - 0.5);
                l.omega = 0.05 * (Math.random() - 0.5);

                app.stage.addChild(l);
                fallingLetters.push(l);
            }
        }
    }

    moveFallingLetters();

    if (letters.allFilled)
        state = gameClear;
}

function gameClear(delta) {
    moveFallingLetters();

    // Create a field to hold steps.
    if (!letters.t) {
        letters.t = 0;
    }
    letters.scale.set(1 + 0.001 * letters.t**3);
    letters.rotation = 0.001 * letters.t**3;
    letters.t += 1;

    if (letters.scale.x > 10)
        initPlay();
}
