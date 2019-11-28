'use strict'

let CharacterImagePaths = {
    ghost: "images/obake.png",
    pumpkin: "images/kabocha.png"
};

let app;
let input;
let state = play;
let letters;

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
    constructor(letters) {
        super();
        letters.forEach(c => {
            let letter = new Letter(c, '#404040', '#606060');
            letter.x = this.width == 0 ? 0 : this.width + letter.margin;
            this.addChild(letter);
        });
        this.cursor = 0;
    }

    fill(c) {
        let unfilledLetter = this.children[this.cursor];
        if (c === unfilledLetter.text) {
            let newLetter = new Letter(unfilledLetter.text, '#ffffff', '#000000');
            newLetter.x = unfilledLetter.x;
            this.removeChildAt(this.cursor);
            this.addChildAt(newLetter, this.cursor);

            this.cursor++;
        }
    }

    get allFilled() {
        return this.cursor >= this.children.length;
    }
}

function initScreen() {
    app = new PIXI.Application({ width: 640, height: 480 });
    app.loader
        .add([
            CharacterImagePaths.ghost,
            CharacterImagePaths.pumpkin,
        ])
        .load(setup);
    
    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup(loader, resources) {
    input = new PlayerInput();
    initPlay();
    app.ticker.add(delta => gameLoop(delta));
}

function initPlay() {
    letters = new Word(['あ', 'い', 'う', 'ちゃ', 'さ']);// new PIXI.Container();
    letters.position.set(
        app.screen.width / 2 - letters.width / 2,
        app.screen.height / 2 - letters.height / 2);
    app.stage.addChild(letters);

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

function addLetter(c) {
    let newLetter = new Letter(c);
    newLetter.x = letters.width == 0 ? 0 : letters.width + newLetter.margin;
    letters.addChild(newLetter);

    letters.position.set(
        app.screen.width / 2 - letters.width / 2,
        app.screen.height / 2 - letters.height / 2);
}

function gameLoop(delta) {
    state(delta);
}

let userInputs = ['あ', 'さ', 'い', 'う', 'う', 'え', 'ちゃ', 'ん'];
let i = 0;

function play(delta) {
    if (input.pressedZ) {
        letters.fill(userInputs[i]);
        i = (i + 1) % userInputs.length;
    }

    if (letters.allFilled)
        initPlay();
}
