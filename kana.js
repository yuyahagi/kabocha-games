'use strict'

// Parameters that determine the game level.
const timeLimit = 30;
const numberOfProblems = 10;

let app;
let problems;
let input;
let typing;
let state = play;
let problemCount;
let letters;
let hpBar;
let intermediary;
let fallingLetters = [];
let gameDoneMessage;
let romajiParser;
let startTime;

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
            // Also append the next letter if:
            //   * This letter is a sokuon ('っ')
            //   * or the next letter is a small one (e.g., 'ゃ').
            let c = text[pos++];
            if (pos < text.length && c === 'っ')
                c += text[pos++];
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
        .add('problemWords', 'words.json')
        .load(setup);
    
    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup(loader, resources) {
    problems = resources.problemWords.data.words;

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

    hpBar = new HpBar(1);
    hpBar.visible = false;
    app.stage.addChild(hpBar);

    gameDoneMessage = new PIXI.Text(
        '',
        {
            fontFamily: 'Arial',
            fontSize: '36px',
            fill: '#ffffff',
            align: 'center',
        });
    gameDoneMessage.anchor.set(0.5);
    gameDoneMessage.position.set(
        app.screen.width / 2,
        app.screen.height / 2);
    gameDoneMessage.visible = false;
    app.stage.addChild(gameDoneMessage);

    initPlay();
    app.ticker.add(delta => gameLoop(delta));
}

function initPlay() {
    problemCount = 0;
    initProblem();
}

function initProblem() {
    if (letters) {
        app.stage.removeChild(letters);
    }
    
    letters = new Word(
        problems[Math.floor(problems.length * Math.random())]);
    letters.pivot.set(
        letters.width / 2,
        letters.height / 2);
    letters.position.set(
        app.screen.width / 2,
        app.screen.height / 2);
    app.stage.addChild(letters);

    intermediary.text = '';

    hpBar.update(1);
    hpBar.visible = true;

    if (typing) typing.unsubscribe();
    typing = new TypingInput();

    romajiParser = new Romaji();

    startTime = app.ticker.lastTime;

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

    // Reduce HP bar.
    const hp = 1 - 0.001 / timeLimit * (app.ticker.lastTime - startTime)
    hpBar.update(hp);

    if (hp <= 0)
        initGameOver();
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
        ++problemCount;
        if (problemCount >= numberOfProblems) {
            initGameClear();
        }
        else {
            state = loadNextProblem;
            initProblem();
        }
    }
}

function initGameClear() {
    intermediary.text = '';
    letters.visible = false;
    gameDoneMessage.text = 'げーむくりあ\nなにか キーを おして ください';
    gameDoneMessage.position.set(
        app.screen.width / 2,
        app.screen.height / 2);
    gameDoneMessage.visible = true;

    state = gameClear;
}

function gameClear(delta) {
    if (typing.getPressedKeys().length > 0) {
        gameDoneMessage.visible = false;
        initPlay();
    }
}

function initGameOver() {
    gameDoneMessage.text = 'げーむおーばー\nなにか キーを おして ください';
    gameDoneMessage.position.set(
        app.screen.width / 2,
        app.screen.height / 4);
    gameDoneMessage.visible = true;

    state = gameOver;
}

function gameOver(delta) {
    if (typing.getPressedKeys().length > 0) {
        gameDoneMessage.visible = false;
        initPlay();
    }

    moveFallingLetters();
}