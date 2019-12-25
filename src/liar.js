'use strict'

import * as PIXI from 'pixi.js';
import { PlayerInput } from './keyboard';
const KnightsAndKnaves = require('./liargen').KnightsAndKnaves;
const Statement = require('./liargen').Statement;

const nspeakers = 3;
const nliars = 1;

let app;
let quiz;
let state;
let input;
let player;
let enemies;

initScreen();

const Directions = {
    down: 0,
    left: 1,
    right: 2,
    up: 3,

    reverse: dir => {
        if (dir === Directions.down) return Directions.up;
        if (dir === Directions.left) return Directions.right;
        if (dir === Directions.right) return Directions.left;
        if (dir === Directions.up) return Directions.down;
    }
};

class Character extends PIXI.Container {
    constructor(textureNameBase) {
        super();

        let directionTextures = new Array(4);
        directionTextures[Directions.down] = [];
        for (let f = 0; f < 3; f++) {
            let texture = PIXI.utils.TextureCache[`${textureNameBase}_down_${f + 1}.png`];
            directionTextures[Directions.down].push(texture);
        }
        directionTextures[Directions.left] = [];
        for (let f = 0; f < 3; f++) {
            let texture = PIXI.utils.TextureCache[`${textureNameBase}_left_${f + 1}.png`];
            directionTextures[Directions.left].push(texture);
        }
        directionTextures[Directions.right] = [];
        for (let f = 0; f < 3; f++) {
            let texture = PIXI.utils.TextureCache[`${textureNameBase}_right_${f + 1}.png`];
            directionTextures[Directions.right].push(texture);
        }
        directionTextures[Directions.up] = [];
        for (let f = 0; f < 3; f++) {
            let texture = PIXI.utils.TextureCache[`${textureNameBase}_up_${f + 1}.png`];
            directionTextures[Directions.up].push(texture);
        }

        this.direction = Directions.down;

        // Character sprite.
        let sprite = new PIXI.AnimatedSprite(directionTextures[this.direction]);
        sprite.animationSpeed = 0.1;
        sprite.play();
        this.addChild(sprite);
        this.sprite = sprite;

        this.directionTextures = directionTextures;
    }

    move(dx, dy) {
        const newDirection = this.stepsToDirection(dx, dy);
        this.setDirection(newDirection);

        this.x += dx;
        this.y += dy;
    }

    setDirection(direction) {
        if (direction !== this.direction) {
            this.direction = direction;
            this.sprite.textures = this.directionTextures[direction];
            this.sprite.play();
        }

    }

    stepsToDirection(dx, dy) {
        if (dx < 0) return Directions.left;
        if (dx > 0) return Directions.right;
        if (dy < 0) return Directions.up;
        if (dy > 0) return Directions.down;
        return this.direction;
    }
}

function initScreen() {
    app = new PIXI.Application({ width: 640, height: 480 });
    app.loader
        .add([
            'images/majo.json',
            'images/kabocha.json',
            'images/obake.json',
        ])
        .load(setup);
    
    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup(loader, resources) {
    input = new PlayerInput();
    quiz = new KnightsAndKnaves(3, 0b101);

    // Construct the answer that has the correct number of liars.
    const digits = (new KnightsAndKnaves(nspeakers)).getRandomOrder(nspeakers);
    let ans = 0;
    for (let i = 0; i < nspeakers - nliars; i++)
        ans |= (1 << digits[i]);
    
    quiz = new KnightsAndKnaves(nspeakers, ans, nliars);
    quiz.generate();

    console.log(`Answer = ${ans}, generated from digits ${digits}`);
    console.log(quiz.toTruthTablesString(true));

    let ghost = new Character('obake');
    ghost.position.set(64, 32);
    app.stage.addChild(ghost);
    let instruction = new PIXI.Text(
        nliars === null
            ? 'うそつき かぼちゃが なんこ いるか わからないよ'
            : `うそつき かぼちゃが ${nliars} こ いるよ`,
        {
            fontFamily: 'Arial',
            fontSize: '20px',
            fill: '#ffffff',
            align: 'left',
        });
    instruction.position.set(ghost.x + 44, ghost.y + 4);
    app.stage.addChild(instruction);

    enemies = [];
    for (let i = 0; i < nspeakers; i++) {
        let pumpkin = new Character('kabocha');
        pumpkin.position.set(
            64,
            82 + 68 * i);
        enemies.push(pumpkin);
        app.stage.addChild(pumpkin);
        let statement = new PIXI.Text(
            `${Statement.speakerIndexToLetter(i)} 「${quiz.statements[i].toNaturalLanguage()}」`,
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                fill: '#ffffff',
                align: 'left',
            });
        app.stage.addChild(statement);
        statement.position.set(pumpkin.x + 44, pumpkin.y + 4);

    }

    player = new Character('majo');
    player.position.set(
        app.screen.width / 2,
        app.screen.height - 64);
    app.stage.addChild(player);

    state = play;
    app.ticker.add(gameLoop);
}

function gameLoop(delta) {
    state(delta);
}

function play(delta) {
    if (input.pressedEsc)
        goToLauncher();
    const dx = 10 * input.arrowX * delta;
    const dy = 10 * input.arrowY * delta;
    player.move(dx, dy);
}

function goToLauncher() {
    window.open('index.html', '_self');
}