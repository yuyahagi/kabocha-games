'use strict'

import * as PIXI from 'pixi.js';
import { PlayerInput } from './keyboard';
import { HpBar } from './hpbar';

let app;
let playerSpeed = 5;
let initialPumpkins = 1;
let maxPumpkinsCount = 10;
let maxPumpkinsSpeed = 5;
let timeBeforeNextPumpkin_s = 5;
let timePumpkingSpawn_s = 0.8;

let CharacterAttributes = {
    ghost: {
        texture_left: "obake_left_1.png",
        texture_right: "obake_right_1.png",
        collison_rect: [6, 0, 20, 27]
    },
    pumpkin: {
        texture_left: "kabocha_left_1.png",
        texture_right: "kabocha_right_1.png",
        collision_rect: [1, 2, 30, 25]
    }
}

let pumpkins;
let player;
let hpBar;
let input;
let startTime;
let state = play;

initScreen();

class Character extends PIXI.Container {
    constructor(charAttributes) {
        super();
        this.textures = [
            PIXI.utils.TextureCache[charAttributes.texture_left],
            PIXI.utils.TextureCache[charAttributes.texture_right]
        ];
        this.sprite = createSprite(this.textures[0]);
        this.addChild(this.sprite);
        this.rotation = 0;

        this.direction = 0;  // Left: 0, right: 1
        this.dx = 0;
        this.dy = 0;
        this.omega = 0;

        this.hittable = true;
    }

    static isHit(c1, c2) {
        if (!(c1.hittable && c2.hittable)) return false;

        // Center-to-center distance.
        let cx1 = c1.x + 0.5 * c1.width;
        let cx2 = c2.x + 0.5 * c2.width;
        let cy1 = c1.y + 0.5 * c1.height;
        let cy2 = c2.y + 0.5 * c2.height;
        let dx = Math.abs(cx2 - cx1);
        let dy = Math.abs(cy2 - cy1);
        
        let halfWidth = 0.5 * (c1.width + c2.width);
        let halfHeight = 0.5 * (c1.height + c2.height);

        if (dx < halfWidth && dy < halfHeight)
            return true;
        else
            return false;
    }
};

class PlayerCharacter extends Character {
    constructor(charAttributes) {
        super(charAttributes)

        this.maxHp = 50;
        this.hp = 50;
    }

    move(delta, arrowX, arrowY) {
        this.dx = playerSpeed * arrowX;
        this.dy = playerSpeed * arrowY;

        if (this.dx < 0 && this.direction == 1) {
            this.direction = 0;
            this.sprite.texture = this.textures[this.direction];
        }
        else if (this.dx > 0 && this.direction == 0) {
            this.direction = 1;
            this.sprite.texture = this.textures[this.direction];
        }

        this.x += this.dx * delta;
        this.y += this.dy * delta;
        this.rotation += this.omega * delta;

        if (this.x - this.width / 2 < 0) this.x = this.width / 2;
        if (this.x + this.width / 2 > 640) this.x = 640 - this.width / 2;
        if (this.y - this.height / 2 < 0) this.y = this.height / 2;
        if (this.y + this.height / 2 > 480) this.y = 480 - this.height / 2;
    }
};

class EnemyCharacter extends Character {
    constructor(charAttributes) {
        super(charAttributes)

        this.spawnTime = timePumpkingSpawn_s * app.ticker.FPS;
        this.spawnCount = this.spawnTime;
        this.hittable = false;

        this.alpha = 0;
    }
    
    update(delta) {
        this.rotation += this.omega * delta;
        if (this.spawnCount > 0) {
            this.spawnCount -= delta;
            this.alpha = 1 - this.spawnCount / this.spawnTime;
            this.children[0].alpha = 1;
            if (this.spawnCount <= 0) {
                this.spawnCount = 0;
                this.alpha = 1;
                this.hittable = true
            }
            return;
        }

        this.x += this.dx * delta;
        this.y += this.dy * delta;

        if (this.x < 10 || this.x > 630) this.dx *= -1;
        if (this.y < 10 || this.y > 470) this.dy *= -1;
    }
}

function initScreen() {
    app = new PIXI.Application({ width: 640, height: 480 });
    app.loader
        .add([
            "images/obake.json",
            "images/kabocha.json"
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
    while (app.stage.children.length > 0) {
        app.stage.removeChildAt(app.stage.children.length - 1);
    }

    player = new PlayerCharacter(CharacterAttributes.ghost);
    player.position.set(0.6 * app.screen.width, 0.6 * app.screen.height);
    player.omega = 0.2 * 2 * Math.PI / 60;
    player.barrierSprite = null;

    hpBar = new HpBar(player.maxHp);
    app.stage.addChild(hpBar);

    pumpkins = new PIXI.Container();
    for (let i = 0; i < initialPumpkins; i++)
        addPumpkin();

    app.stage.addChild(player);
    app.stage.addChild(pumpkins);

    startTime = app.ticker.lastTime;

    state = play;
}

function createSprite(texture) {
    let sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(2);
    return sprite;
}

function gameLoop(delta) {
    state(delta);
}

function play(delta) {
    if (input.pressedEsc)
        goToLauncher();
    
    player.move(delta, input.arrowX, input.arrowY);
    if (input.pressedZ)
        addPumpkin();

    let phase = 1 + Math.floor(0.001 * (app.ticker.lastTime - startTime) / timeBeforeNextPumpkin_s);
    if (phase > maxPumpkinsCount) {
        initGameClear();
    }


    if (phase > pumpkins.children.length)
        addPumpkin();

    let isHit = false;
    pumpkins.children.forEach(element => {
        element.update(delta);
        if (Character.isHit(player, element)) {
            isHit = true;
            player.hp--;
        }
    });

    if (isHit)
        toggleBarrier(player);
    else
        hideBarrier(player);
    
    hpBar.update(player.hp);
    
    if (player.hp <= 0) {
        initGameover();
    }
}

function addPumpkin() {
    const x0 = 20 + Math.random() * (app.screen.width-40);
    const y0 = 20 + Math.random() * (app.screen.height-40);
    let newPumpkin = new EnemyCharacter(CharacterAttributes.pumpkin);
    newPumpkin.position.set(x0, y0);
    newPumpkin.dx = maxPumpkinsSpeed * 2 * (Math.random() - 0.5);
    newPumpkin.dy = maxPumpkinsSpeed * 2 * (Math.random() - 0.5);
    newPumpkin.omega = -2 * 2 * Math.PI / 180;

    if (pumpkins.children.length >= maxPumpkinsCount)
        pumpkins.removeChild(pumpkins.children[0]);
    pumpkins.addChild(newPumpkin);
}

function toggleBarrier(character) {
    if (character.barrierSprite === null) {
        showBarrier(character);
    }
    else {
        hideBarrier(character);
    }
}

function showBarrier(character) {
    if (character.barrierSprite !== null) return;

    let circle = new PIXI.Graphics();
    character.addChild(circle);
    character.barrierSprite = circle;

    circle.lineStyle(5, 0x00ffff, 0.9);
    circle.drawCircle(0, 0, 48);
}

function hideBarrier(character) {
    if (character.barrierSprite === null) return;

    character.removeChild(character.barrierSprite);
    character.barrierSprite = null;
}

function initGameover() {
    let msg = new PIXI.Text(
        'げーむおーばー\nもう一回あそぶ (z)',
        {
            fontFamily: 'Arial',
            fontSize: '36px',
            fill: "#FFFFFF",
            align: 'center',
        });
    msg.anchor.set(0.5);
    msg.position.set(app.screen.width / 2, app.screen.height / 2);
    app.stage.addChild(msg);
    state = gameDone;
}

function gameDone(delta) {
    if (input.pressedEsc)
        goToLauncher();
    if (input.pressedZ)
        initPlay();
}

function initGameClear() {
    let msg = new PIXI.Text(
        'くりあ\nもう一回遊ぶ (z)',
        {
            fontFamily: 'Arial',
            fontSize: '36px',
            fill: '#FFFFFF',
            align: 'center'
        }
    );
    msg.anchor.set(0.5);
    msg.position.set(app.screen.width / 2, app.screen.height / 2);
    app.stage.addChild(msg);
    state = gameDone;
}

function goToLauncher() {
    window.open('index.html', '_self');
}