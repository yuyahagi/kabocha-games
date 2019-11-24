'use strict'

let app = new PIXI.Application({ width: 640, height: 480 });
let maxPumpkinsCount = 10;

let CharacterImagePaths = {
    ghost: "images/obake.png",
    pumpkin: "images/kabocha.png"
};

class Character extends PIXI.Container {
    constructor(imgPath, x, y) {
        super();
        let sprite = loadSprite(imgPath, new PIXI.Rectangle(0, 32, 32, 32));
        this.addChild(sprite);
        this.position.set(x, y);
        this.rotation = 0;

        this.dx = 0;
        this.dy = 0;
        this.omega = 0;
        this.hp = 1;
    }

    static isHit(c1, c2) {
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

let pumpkins;
let player;
let state = play;

function initScreen() {
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
    player = new Character(CharacterImagePaths.ghost, 320, 240);
    player.omega = 0.2 * 2 * Math.PI / 60;
    player.barrierSprite = null;
    
    pumpkins = new PIXI.Container();
    addPumpkin();

    app.stage.addChild(player);
    app.stage.addChild(pumpkins);

    // Capture keyboard arrow keys.
    let left = keyboard("ArrowLeft"),
        up = keyboard("ArrowUp"),
        right = keyboard("ArrowRight"),
        down = keyboard("ArrowDown"),
        space = keyboard(" "),
        keyz = keyboard("z"),
        keyx = keyboard("x");
    
    let sp = 5;
    left.press = () => { player.dx -= sp; }
    up.press = () => { player.dy -= sp; }
    right.press = () => { player.dx += sp; }
    down.press = () => { player.dy += sp; }
    left.release = () => { player.dx = 0; player.dy = 0 }
    up.release = () => { player.dx = 0; player.dy = 0 }
    right.release = () => { player.dx = 0; player.dy = 0 }
    down.release = () => { player.dx = 0; player.dy = 0 }

    keyz.press = () => { addPumpkin(); };
    keyx.press = () => { toggleBarrier(); };

    app.ticker.add(delta => gameLoop(delta));
}

function loadSprite(imgPath, rectangle) {
    let texture = PIXI.utils.TextureCache[imgPath];
    texture.frame = rectangle;
    let sprite = new PIXI.Sprite(texture);

    sprite.anchor.set(0.5, 0.5);
    sprite.scale.set(2);

    sprite.vx = 0;
    sprite.vy = 0;
    sprite.omega = 2 * Math.PI * 0.1 / 60;

    return sprite;
}

function gameLoop(delta) {
    state(delta);
}

function play(delta) {
    moveSprite(player, delta);

    let isHit = false;
    pumpkins.children.forEach(element => {
        moveSprite(element, delta, true);
        if (Character.isHit(player, element)) {
            isHit = true;
        }
    });

    if (isHit)
        toggleBarrier(player);
    else
        hideBarrier(player);
}

function moveSprite(sprite, delta, toBounce = false) {
    sprite.x += sprite.dx * (1 + delta);
    sprite.y += sprite.dy * (1 + delta);
    sprite.rotation += sprite.omega * (1 + delta);

    if (toBounce) {
        if (sprite.x < 10 || sprite.x > 630) sprite.dx *= -1;
        if (sprite.y < 10 || sprite.y > 470) sprite.dy *= -1;
    }
}

function addPumpkin() {
    let newPumpkin = new Character(CharacterImagePaths.pumpkin, player.x, player.y);
    newPumpkin.position = player.position;
    newPumpkin.dx = 5 * 2 * (Math.random() - 0.5);
    newPumpkin.dy = 5 * 2 * (Math.random() - 0.5);
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