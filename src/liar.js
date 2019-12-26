'use strict'

import * as PIXI from 'pixi.js';
import { PlayerInput } from './keyboard';
const KnightsAndKnaves = require('./liargen').KnightsAndKnaves;
const Statement = require('./liargen').Statement;

const nspeakers = 5;
const nliars = 1;

let app;
let quiz;
let state;
let input;
let player;
let beams;
let cursor;
let speakers;
let selectables;
let selected = 0;

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
    constructor(textureNameBase, isLiar = false) {
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

        // Labeling for a liar.
        const liarLabel = new PIXI.Text(
            'うそつき',
            {
                fontFamily: 'Arial',
                fontSize: '12px',
                fill: '#ffffff',
                align: 'left',
            });
            liarLabel.position.set(
                sprite.width / 2 - liarLabel.width / 2,
                -18);
        liarLabel.visible = false;
        this.addChild(liarLabel);
        this.isLiar = isLiar;
        this.liarLabel = liarLabel;

        // Recticle.
        const recticle = new PIXI.Graphics();
        this.addChild(recticle);
        recticle.lineStyle(2, 0xffffff, 0.7);
        const cx = this.sprite.width / 2;
        const cy = this.sprite.height / 2;
        for (let i = 0; i < 2; i++) {
            const r = 12 + 10 * i
            recticle.drawCircle(cx, cy, r);
        }
        recticle.moveTo(cx - 28, cy); recticle.lineTo(cx + 28, cy);
        recticle.moveTo(cx, cy - 28); recticle.lineTo(cx, cy + 28);
        recticle.visible = false;
        this.recticle = recticle;

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

    get isTargeted() {
        return this.recticle.visible;
    }

    toggleRecticle() {
        this.recticle.visible = !this.recticle.visible;
    }

    showLiarLabel() {
        this.liarLabel.visible = this.isLiar;
    }
}

class Cursor extends PIXI.Container {
    constructor(x, y, w, h) {
        super();

        const g = new PIXI.Graphics();
        this.sprite = g;
        this.addChild(g);
        this.update(x, y, w, h);

        this.targetPos = { x: x, y: y, w: w, h: h };
        this.lastPos = { x: x, y: y, w: w, h: h };
        this.moveTime = 5;
        this.moveCounter = 0;
    }

    update(x, y, w, h) {
        this.sprite.clear();
        this.sprite.lineStyle(2, 0xffffff);
        this.sprite.drawRoundedRect(x, y, w, h, 6);

    };

    moveToObject(delta, obj) {
        const w = obj.sprite ? obj.sprite.width : obj.width;
        const h = obj.sprite ? obj.sprite.height : obj.height;
        cursor.move(
            delta,
            obj.x - 5,
            obj.y - 5,
            w + 10,
            h + 10);
    }

    move(delta, x, y, w, h) {
        if (this.moveCounter <= 0) {
            if (x === this.targetPos.x
                && y === this.targetPos.y
                && w === this.targetPos.w
                && h === this.targetPos.h)
                return;

            this.lastPos = this.targetPos;
            this.targetPos = { x: x, y: y, w: w, h: h };
            this.moveCounter = this.moveTime;
        }
        else {
            this.moveCounter -= delta;
            if (this.moveCounter < 0) this.moveCounter = 0;
        }

        const x1 = this.targetPos.x;
        const y1 = this.targetPos.y;
        const w1 = this.targetPos.w;
        const h1 = this.targetPos.h;
        const x0 = this.lastPos.x;
        const y0 = this.lastPos.y;
        const w0 = this.lastPos.w;
        const h0 = this.lastPos.h;
        if (x1 !== x0 || y1 !== y0 || w1 !== w0 || h1 !== h0) {
            const ratio = this.moveCounter / this.moveTime;
            this.update(
                x1 - ratio * (x1 - x0),
                y1 - ratio * (y1 - y0),
                w1 - ratio * (w1 - w0),
                h1 - ratio * (h1 - h0));
        }
    }
}

class Beams extends PIXI.Container {
    constructor(targetObjects) {
        super();

        this.beams = [];

        // const target = targetObjects[i];
        this.n = 0;
        targetObjects.forEach(target => {
            if (target.isTargeted) {
                this.n++;
                const beam = new PIXI.Graphics();

                beam.x0 = player.x + player.width / 2;
                beam.y0 = player.y + player.height / 2;
                const pos = target.sprite.getGlobalPosition();
                const x1 = pos.x + target.sprite.width / 2;
                const y1 = pos.y + target.sprite.height / 2;
                const lx = x1 - beam.x0;
                const ly = y1 - beam.y0;
                const scale = lx / ((0 - beam.x0) - lx);
                beam.x1 = beam.x0 + scale * lx;
                beam.y1 = beam.y0 + scale * ly;

                this.beams.push(beam);
                this.addChild(beam);
            }
        });

        this.moveTime = 10;
        this.currentBeamCounter = 0;
        this.moveCounter = this.moveTime * this.n;

    }

    update(delta) {
        this.moveCounter -= delta;
        if (this.moveCounter < 0)
            this.moveCounter = 0;

        const current = Math.floor(this.moveCounter / this.moveTime);
        const beamIdx = current === this.n ? 0 : this.n - current - 1;

        const ratio = (this.moveCounter % this.moveTime) / this.moveTime;
        for (let i = 0; i < beamIdx; i++)
            this.beams[beamIdx - 1].clear();
        
        if (beamIdx < this.n) {
            const beam = this.beams[beamIdx];
            beam.clear();
            beam.lineStyle(4, 0xffff00, ratio);
            beam.moveTo(beam.x0, beam.y0);
            beam.lineTo(beam.x1, beam.y1);
        }
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
    const instruction = new PIXI.Text(
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

    speakers = [];
    for (let i = 0; i < nspeakers; i++) {
        const isLiar = ((1 << i) & quiz.answer) === 0;
        const pumpkin = new Character('kabocha', isLiar);
        pumpkin.position.set(
            64,
            82 + 68 * i);
        speakers.push(pumpkin);
        app.stage.addChild(pumpkin);
        const statement = new PIXI.Text(
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

    const fireButton = new PIXI.Text(
        'ふぁいやー',
        {
            fontFamily: 'Arial',
            fontSize: '20px',
            fill: '#ffffff',
            align: 'left',
        });
    fireButton.position.set(
        app.screen.width - fireButton.width - 96,
        app.screen.height - fireButton.height - 32);
        app.stage.addChild(fireButton);
        
        player = new Character('majo');
    app.stage.addChild(player);

    selectables = [];
    speakers.forEach(s => selectables.push(s));
    selectables.push(fireButton);

    cursor = new Cursor (
        selectables[0].x - 5,
        selectables[0].y - 5,
        selectables[0].sprite.width + 10,
        selectables[0].sprite.height + 10);
    app.stage.addChild(cursor);

    initPlay();
    app.ticker.add(gameLoop);
}

function gameLoop(delta) {
    state(delta);
}

function initPlay() {
    player.position.set(
        app.screen.width / 2,
        app.screen.height - 64);

    state = play;
}

function play(delta) {
    if (input.pressedEsc)
        goToLauncher();
    
    selected = (selected + input.pressedArrowY + selectables.length) % selectables.length;
    const pressedArrowX = input.pressedArrowX;
    if (selected === selectables.length - 1 && pressedArrowX < 0)
        selected = selectables.length - 2;
    else if (pressedArrowX > 0)
        selected = selectables.length - 1;
    
    if (input.pressedEnter || input.pressedZ) {
        if (selected < speakers.length)
            speakers[selected].toggleRecticle();
        else {
            initCheckingAnswer();
        }
    }
    
    cursor.moveToObject(delta, selectables[selected]);
}

function initCheckingAnswer() {
    beams = new Beams(selectables.slice(0, quiz.n));
    app.stage.addChild(beams);
    state = checkingAnswer;
}

function checkingAnswer(delta) {
    beams.update(delta);
    if (beams.moveCounter <= 0) {
        // for (let i = 0; i < quiz.n; i++) {
        //     const speaker = selectables[i];
        speakers.forEach(speaker => {
            speaker.showLiarLabel();
        });

        if (input.pressedZ || input.pressedEnter) {
            app.stage.removeChild(beams);
            beams = null;

            state = play;
        }
    }
}

function goToLauncher() {
    window.open('index.html', '_self');
}