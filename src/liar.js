'use strict'

import * as PIXI from 'pixi.js';
import { PlayerInput } from './keyboard';
const KnightsAndKnaves = require('./liargen').KnightsAndKnaves;
const Statement = require('./liargen').Statement;

const levels = [
    { name: 'れんしゅう', nspeakers: 2, nliars: 1 },
    { name: 'ほんばん', nspeakers: 3, nliars: 1 },
    { name: 'マスター', nspeakers: 4, nliars: 2 },
    { name: 'げきむず', nspeakers: 5, nliars: null },
]

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

let levelSelectionScene;
let gameScene;

let instruction;
let fireButton;

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
        sprite.pivot.set(
            sprite.width / 2,
            sprite.height / 2);
        sprite.animationSpeed = 0.1;
        sprite.play();
        this.addChild(sprite);
        this.sprite = sprite;

        this.directionTextures = directionTextures;

        this.damageCounter = 0;
        this.damageTime = 10;
    }

    move(dx, dy) {
        const newDirection = this.stepsToDirection(dx, dy);
        this.setDirection(newDirection);

        this.x += dx;
        this.y += dy;
    }

    setDirection(direction) {
        this.direction = direction;
        this.sprite.textures = this.directionTextures[direction];
    }

    damage() {
        // Default empty damage motion.
    }

    damageMotion() {
        // Default empty damage motion.
    }

    update(delta) {
        if (this.damageCounter <= 0) {
            // Nothing to do.
            return;
        }
        else {
            this.damageCounter -= delta;
            if (this.damageCounter < 0) this.damageCounter = 0;

            this.damageMotion(delta);
        }
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

class SpeakerCharacter extends Character {
    constructor(textureNameBase, statement, isLiar) {
        super(textureNameBase, isLiar);

        this.statementSprite = new PIXI.Text(
            statement,
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                fill: '#ffffff',
                align: 'left',
            });
        this.addChild(this.statementSprite);
        this.statementSprite.position.set(
            this.sprite.x - this.sprite.width / 2 + 44,
            this.sprite.y - this.sprite.height / 2+ 4);

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
            -liarLabel.width / 2,
            -this.sprite.pivot.y - 18);
        liarLabel.visible = false;
        this.addChild(liarLabel);
        this.isLiar = isLiar;
        this.liarLabel = liarLabel;

        // Recticle.
        const recticle = new PIXI.Graphics();
        this.addChild(recticle);
        recticle.lineStyle(2, 0xffffff, 0.7);
        const cx = 0;
        const cy = 0;
        for (let i = 0; i < 2; i++) {
            const r = 12 + 10 * i
            recticle.drawCircle(cx, cy, r);
        }
        recticle.moveTo(cx - 28, cy); recticle.lineTo(cx + 28, cy);
        recticle.moveTo(cx, cy - 28); recticle.lineTo(cx, cy + 28);
        recticle.visible = false;
        this.recticle = recticle;
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
        this.setPositionAndSize(x, y, w, h);

        this.targetPos = { x: x, y: y, w: w, h: h };
        this.lastPos = { x: x, y: y, w: w, h: h };
        this.moveTime = 5;
        this.moveCounter = 0;
    }

    setPositionAndSize(x, y, w, h) {
        this.sprite.clear();
        this.sprite.lineStyle(2, 0xffffff);
        this.sprite.drawRoundedRect(x, y, w, h, 6);
    };

    moveToObject(delta, obj) {
        const gpos = obj.getGlobalPosition();
        const pivot = obj.pivot;
        const w = obj.width;
        const h = obj.height;
        cursor.move(
            delta,
            gpos.x - pivot.x - 5,
            gpos.y - pivot.y - 5,
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
            this.setPositionAndSize(
                x1 - ratio * (x1 - x0),
                y1 - ratio * (y1 - y0),
                w1 - ratio * (w1 - w0),
                h1 - ratio * (h1 - h0));
        }
    }
}

class Beams extends PIXI.Container {
    constructor() {
        super();

        this.n = 0;
        this.beams = [];
        this.sources = [];
        this.targets = [];
        this.explosions = [];

        this.moveTime = 20;
        this.moveCounter = 0;

        // Cache explosion sprite.
        this.explosionTextures = createExplosionTextures();
    }

    addBeam(sourceCharacter, targetCharacter) {
        this.sources.push(sourceCharacter);
        this.targets.push(targetCharacter);

        const beam = new PIXI.Graphics();
        
        const seg = this.getBeamSegment(sourceCharacter, targetCharacter);
        beam.x0 = seg.x0;
        beam.y0 = seg.y0;
        beam.x1 = seg.x1;
        beam.y1 = seg.y1;
        
        this.n++;
        this.beams.push(beam);
        this.addChild(beam);

        // Prepare explosion sprites.
        const explosion = createExplosion(this.explosionTextures);
        // explosion.position.set(seg.xTgt, seg.yTgt);
        this.addChild(explosion);
        this.explosions.push(explosion);
    }

    getBeamSegment(sourceCharacter, targetCharacter) {
        const pos0 = sourceCharacter.sprite.getGlobalPosition();
        const pos1 = targetCharacter.sprite.getGlobalPosition();

        // Shooter object position.
        const x0 = pos0.x;
        const y0 = pos0.y;

        // Target object position.
        const xTgt = pos1.x;
        const yTgt = pos1.y;

        // Make the beam penetrate the target.
        // Beam segment end position.
        let x1, y1;
        if (xTgt - x0 > 0) x1 = app.screen.width;
        else if (xTgt - x0 < 0) x1 = 0;
        else x1 = xTgt;

        const lx = xTgt - x0;
        const ly = yTgt - y0;
        const scale = (x1 - x0) / lx;
        x1 = x0 + scale * lx;
        y1 = y0 + scale * ly;

        return {
            x0: x0, y0: y0,
            x1: x1, y1: y1,
            xTgt: xTgt, yTgt: yTgt, 
        };
    }

    startBeams() {
        this.moveCounter = this.moveTime * this.n;
        this.currentBeamIndex = -1;
    }

    update(delta) {
        this.moveCounter -= delta;
        if (this.moveCounter < 0)
            this.moveCounter = 0;

        if (this.n === 0)
            return;

        const current = Math.floor(this.moveCounter / this.moveTime);
        const beamIdx = current === this.n ? 0 : this.n - current - 1;

        const ratio = (this.moveCounter % this.moveTime) / this.moveTime;
        for (let i = 0; i < beamIdx; i++)
            this.beams[beamIdx - 1].clear();
        
        if (beamIdx !== this.currentBeamIndex) {
            // By the time this beam is fired, the target position may have been moved.
            // Update the beam segment.
            for (let idx = this.currentBeamIndex + 1; idx <= beamIdx; idx++) {
                const source = this.sources[idx];
                const target = this.targets[idx];
                const beam = this.beams[idx];
                const explosion = this.explosions[idx];
                const segment = this.getBeamSegment(source, target);
                beam.x0 = segment.x0;
                beam.y0 = segment.y0;
                beam.x1 = segment.x1;
                beam.y1 = segment.y1;
                explosion.position.set(
                    segment.xTgt,
                    segment.yTgt);
                explosion.play();
                target.damage();
                }
            this.currentBeamIndex = beamIdx;
        }
        
        const beam = this.beams[beamIdx];
        beam.clear();
        beam.lineStyle(4, 0xffff00, ratio);
        beam.moveTo(beam.x0, beam.y0);
        beam.lineTo(beam.x1, beam.y1);
    }
}

function createExplosionTextures() {
    const n = 12;
    const rmax = 20;
    const r1delay = 0.3;
    let textures = new Array(n);
    for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const r2 = rmax * (1 - Math.exp(-t / 0.05));
        const r1 = t < r1delay
            ? 0
            : rmax * (1 - Math.exp(-(t - r1delay) / 0.1));
        const color = hot(1 - t * t);
        let g = new PIXI.Graphics();
        g.beginFill(color, 1);
        g.drawCircle(0, 0, r2);
        g.endFill();
        if (r1 > 0) {
            g.beginHole();
            g.drawCircle(0, 0, r1);
            g.endHole();
        }

        textures[i] = app.renderer.generateTexture(g);
    }

    return textures;
}

function createExplosion(textures) {
    let explosionSprite = new PIXI.AnimatedSprite(textures);
    explosionSprite.anchor.set(0.5);
    explosionSprite.animationSpeed = 0.25;
    explosionSprite.loop = false;

    return explosionSprite;
}

// Loosely emulating Matlab's "hot" colormap.
function hot(n) {
    const r = n < 0.37 ? n / 0.37 : 1;
    const g = (n >= 0.37 && n < 0.75) ? (n - 0.37) / 0.38
        : (n < 0.37 ? 0 : 1);
    const b = n >= 0.75 ? (n - 0.75) / 0.25 : 0;
    const R = Math.floor(255 * r);
    const G = Math.floor(255 * g);
    const B = Math.floor(255 * b);
    return (R << 16) | (G << 8) | B;
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

    // ========================================================================
    // Common instruction to be used across all scenes.
    // ========================================================================
    instruction = new SpeakerCharacter('obake', '');
    instruction.position.set(80, 48);
    app.stage.addChild(instruction);

    // ========================================================================
    // Level selection scene.
    // ========================================================================
    levelSelectionScene = new PIXI.Container();
    app.stage.addChild(levelSelectionScene);

    const g = new PIXI.Graphics();
    g.beginFill(0xffffff, 0.25);
    g.drawRect(210, 100, 220, 280);
    g.endFill();
    levelSelectionScene.addChild(g);

    levelSelectionScene.selectables = [];
    levels.forEach((level, index) => {
        const t = new PIXI.Text(
            level.name,
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                fill: '#ffffff',
                align: 'center',
            });
        t.position.set(
            app.screen.width / 2 - t.width / 2,
            120 + 8 + 64 * index);
        levelSelectionScene.addChild(t);
        levelSelectionScene.selectables.push(t);
    });
    levelSelectionScene.selected = 0;

    // ========================================================================
    // Game play scene.
    // ========================================================================
    gameScene = new PIXI.Container();
    app.stage.addChild(gameScene);

    fireButton = new PIXI.Text(
        '',
        {
            fontFamily: 'Arial',
            fontSize: '20px',
            fill: '#ffffff',
            align: 'left',
        });
    fireButton.position.set(
        448,
        416 + 4);
    gameScene.addChild(fireButton);
        
    player = new Character('majo');
    gameScene.addChild(player);

    // Custom damage motion for the player.
    player.damageTime = 50;
    player.damage = () => {
        player.damageCounter = player.damageTime;
        player.vx = 5;
        player.y0 = player.y;
    };
    player.damageMotion = delta => {
        const t = (player.damageTime - player.damageCounter) / player.damageTime;
        const jumpHeight = 50;
        const y = jumpHeight * (1 - 4 * (t - 0.3) * (t - 0.3))

        player.x += player.vx * delta;
        player.y = player.y0 - y;
        player.rotation += 0.3 * delta;
    };

    speakers = [];

    // ========================================================================
    // Cursor will be used across all scenes.
    // ========================================================================
    cursor = new Cursor(0, 0, 10, 10);
    app.stage.addChild(cursor);

    initSelectLevel();
    app.ticker.add(gameLoop);
}

function gameLoop(delta) {
    state(delta);
}

function initSelectLevel() {
    levelSelectionScene.visible = true;
    gameScene.visible = false;

    instruction.statementSprite.text = 'レベルを えらんでね';

    state = selectLevel;
}

function selectLevel(delta) {
    if (input.pressedEsc)
        goToLauncher();
    
    levelSelectionScene.selected
        = (levelSelectionScene.selected + input.pressedArrowY + levelSelectionScene.selectables.length)
        % levelSelectionScene.selectables.length;
    cursor.moveToObject(
        delta,
        levelSelectionScene.selectables[levelSelectionScene.selected]);
    
    if (input.pressedEnter || input.pressedZ) {
        levelSelectionScene.visible = false;
        initPlay();
    }
}

function initPlay() {
    gameScene.visible = true;

    const level = levelSelectionScene.selected;
    const nspeakers = levels[level].nspeakers;
    const nliars = levels[level].nliars;
    
    player.position.set(
        416,
        432);
    player.setDirection(Directions.left);
    player.vx = 0;
    player.rotation = 0;

    // Adjust UI texts.
    instruction.statementSprite.text = nliars === null
        ? 'うそつき かぼちゃが なんこ いるか わからないよ'
        : `うそつき かぼちゃが ${nliars} こ いるよ`;
    fireButton.text = 'ふぁいやー';

    let ans = 0;
    if (nliars === null) {
        // Number of liars not specified. Randomize.
        const nrows = Math.pow(2, nspeakers);
        ans = Math.floor(nrows * Math.random());
    }
    else {
        // Construct the answer that has the correct number of liars.
        const digits = (new KnightsAndKnaves(nspeakers)).getRandomOrder(nspeakers);
        for (let i = 0; i < nspeakers - nliars; i++)
            ans |= (1 << digits[i]);
    }

    // Generate quiz.
    quiz = new KnightsAndKnaves(nspeakers, ans, nliars);
    quiz.generate();
    console.log(`Answer = ${ans}`);
    console.log(quiz.toTruthTablesString(true));

    speakers.forEach(s => gameScene.removeChild(s));
    speakers = [];
    for (let i = 0; i < nspeakers; i++) {
        const isLiar = ((1 << i) & quiz.answer) === 0;
        const pumpkin = new SpeakerCharacter(
            'kabocha',
            `${Statement.speakerIndexToLetter(i)} 「${quiz.statements[i].toNaturalLanguage()}」`,
            isLiar);
        gameScene.addChild(pumpkin);
        pumpkin.position.set(
            80,
            98 + 68 * i);
        speakers.push(pumpkin);

        // Damage motion for liar pumpkin.
        if (isLiar) {
            pumpkin.damage = () => {
                pumpkin.damageCounter = pumpkin.damageTime;
                pumpkin.sprite.visible = false;
            }
        }
    }

    selected = 0;
    selectables = [];
    speakers.forEach(s => selectables.push(s.sprite));
    selectables.push(fireButton);

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
    beams = new Beams();
    app.stage.addChild(beams);

    speakers.forEach(speaker => {
        if (speaker.isTargeted)
            beams.addBeam(player, speaker);
    });

    // If wrong speakers are targeted or liars remain untargeted,
    // have them fire back.
    for (let i = 0; i < quiz.n; i++) {
        const speaker = speakers[i];
        if (speaker.isLiar ^ speaker.isTargeted)
            beams.addBeam(speaker, player);
    }

    beams.startBeams();
    state = checkingAnswer;
}

function checkingAnswer(delta) {
    beams.update(delta);
    player.update(delta);
    speakers.forEach(s => { s.update(delta); });
    cursor.moveToObject(delta, fireButton);

    if (beams.moveCounter <= 0 && player.damageCounter <= 0) {
        speakers.forEach(speaker => {
            speaker.showLiarLabel();
        });

        let correct = true;
        speakers.forEach(speaker => {
            correct &= !(speaker.isLiar ^ speaker.isTargeted);
        });
        instruction.statementSprite.text = correct ? 'せいかい' : 'はずれ';

        fireButton.text = 'もういちど あそぶ';

        // Remove beams.
        app.stage.removeChild(beams);
        beams = null;

        state = gameDone;
    }
}

function gameDone(delta) {
    if (input.pressedEsc)
        goToLauncher();
    
    cursor.moveToObject(delta, fireButton);
    if (input.pressedZ || input.pressedEnter)
        initSelectLevel();
}

function goToLauncher() {
    window.open('index.html', '_self');
}