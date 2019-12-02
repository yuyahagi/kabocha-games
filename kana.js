'use strict'

const problems = [
    'あ',
    'もり',
    'えん',
    'いか',
    'たこ',
    'あか',
    'かず',
    'がく',
    'とる',
    'のり',
    'もも',
    'はな',
    'まま',
    'むし',
    'おなか',
    'みどり',
    'すいか',
    'さかな',
    'かえる',
    'ふぁいと',
    'うちゅう',
    'おにぎり',
    'ばしゃばしゃ',
    'うみのいきもの',
];

let app;
let input;
let typing;
let state = play;
let letters;
let intermediary;
let fallingLetters = [];
let gameClearMessage;
let romajiParser;

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
        
        this.margin = 6;
    }
}

class Word extends PIXI.Container {
    constructor(text) {
        super();

        // List of auxiliary letters that attach to the normal ones.
        const a = ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'];

        let pos = 0;
        while (pos < text.length) {
            // The letter to be rendered.
            // Check if the next letter attaches to the current one (e.g., 'きゃ').
            let c = text[pos++];
            if (pos < text.length && a.includes(text[pos]))
                c += text[pos++];
            
            let letter = new Letter(c, '#404040', '#606060');
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

    intermediary = new PIXI.Text(
        '',
        {
            fontFamily: 'Arial',
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center',
        });
    intermediary.anchor.set(0.5);
    intermediary.position.set(
        app.screen.width / 2,
        app.screen.height / 2 + 80);
    app.stage.addChild(intermediary);

    gameClearMessage = new PIXI.Text(
        'げーむ くりあ\nなにか キーを おして ください',
        {
            fontFamily: 'Arial',
            fontSize: '36px',
            fill: '#ffffff',
            align: 'center',
        });
    gameClearMessage.anchor.set(0.5);
    gameClearMessage.position.set(
        app.screen.width / 2,
        app.screen.height / 2);
    gameClearMessage.visible = false;
    app.stage.addChild(gameClearMessage);

    initPlay();
    app.ticker.add(delta => gameLoop(delta));
}

let problemIndex = 0;
function initPlay() {
    if (letters) {
        app.stage.removeChild(letters);
    }

    letters = new Word(problems[problemIndex]);
    letters.pivot.set(
        letters.width / 2,
        letters.height / 2);
    letters.position.set(
        app.screen.width / 2,
        app.screen.height / 2);
    app.stage.addChild(letters);

    intermediary.text = '';

    if (typing) typing.unsubscribe();
    typing = new TypingInput();

    romajiParser = new Romaji();

    state = play;
}

function fillLetter(index, c) {
    let newLetter = new Letter(c, '#ffffff', '#000000')
    newLetter.x = 0;
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
    const keypresses = typing.getPressedKeys();

    // If you type fast, there may be multiple keypresses.
    // Process all of them until all letters in the problem
    // have been filled.
    let pos = 0;
    while (pos < keypresses.length && !letters.allFilled) {
        // Parse input characters into a romaji.
        while (!romajiParser.finalized && pos < keypresses.length) {
            romajiParser.append(keypresses[pos]);
            ++pos;
        }

        intermediary.text = romajiParser.characters.toLowerCase();

        if (romajiParser.finalized) {
            // Parsing finalized. This may be a valid letter
            // or may be a failed parsing.
            const nextInput = romajiParser.parsed;
            romajiParser.clear();
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

    if (letters.allFilled) {
        state = loadNextProblem;
    }
}

function loadNextProblem(delta) {
    moveFallingLetters();

    // Create a field to hold steps.
    if (!letters.t) {
        letters.t = 0;
    }
    letters.scale.set(1 + 0.001 * letters.t**3);
    letters.rotation = 0.001 * letters.t**3;
    letters.t += 1;

    if (letters.scale.x > 10) {
        ++problemIndex;
        if (problemIndex >= problems.length) {
            initGameClear();
        }
        else {
            state = loadNextProblem;
            initPlay();
        }
    }
}

function initGameClear() {
    intermediary.text = '';
    letters.visible = false;
    gameClearMessage.visible = true;

    state = gameClear;
}

function gameClear(delta) {
    if (typing.getPressedKeys().length > 0) {
        problemIndex = 0;
        gameClearMessage.visible = false;
        initPlay();
    }
}