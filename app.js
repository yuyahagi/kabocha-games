'use strict'

let app = new PIXI.Application({ width: 640, height: 480 });
let maxPumpkinsCount = 10;
let pumpkins;
let mainCharacter;
let state = play;

function initScreen() {
    app.loader
        .add([
            "images/obake.png",
            "images/obake_kage.png",
            "images/kabocha.png",
        ])
        .load(setup);

    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup(loader, resources) {
    mainCharacter = new PIXI.Container();
    let obake = loadSprite("images/obake.png", new PIXI.Rectangle(0, 32, 32, 32));
    mainCharacter.addChild(obake);
    mainCharacter.position.set(320, 240);
    mainCharacter.vx = 0;
    mainCharacter.vy = 0;
    mainCharacter.omega = 0.2 * 2 * Math.PI / 60;
    mainCharacter.barrierSprite = null;
    
    pumpkins = new PIXI.Container();
    addPumpkin();

    app.stage.addChild(mainCharacter);
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
    left.press = () => { mainCharacter.vx -= sp; }
    up.press = () => { mainCharacter.vy -= sp; }
    right.press = () => { mainCharacter.vx += sp; }
    down.press = () => { mainCharacter.vy += sp; }
    left.release = () => { mainCharacter.vx = 0; mainCharacter.vy = 0 }
    up.release = () => { mainCharacter.vx = 0; mainCharacter.vy = 0 }
    right.release = () => { mainCharacter.vx = 0; mainCharacter.vy = 0 }
    down.release = () => { mainCharacter.vx = 0; mainCharacter.vy = 0 }

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
    moveSprite(mainCharacter, delta);
    pumpkins.children.forEach(element => {
        moveSprite(element, delta, true);
    });

}

function moveSprite(sprite, delta, toBounce = false) {
    sprite.x += sprite.vx * (1 + delta);
    sprite.y += sprite.vy * (1 + delta);
    sprite.rotation += sprite.omega * (1 + delta);

    if (toBounce) {
        if (sprite.x < 10 || sprite.x > 630) sprite.vx *= -1;
        if (sprite.y < 10 || sprite.y > 470) sprite.vy *= -1;
    }

}

function addPumpkin() {
    let newPumpkin = loadSprite("images/kabocha.png", new PIXI.Rectangle(0, 32, 32, 32));
    newPumpkin.position = mainCharacter.position;
    newPumpkin.vx = 5 * 2 * (Math.random() - 0.5);
    newPumpkin.vy = 5 * 2 * (Math.random() - 0.5);
    newPumpkin.omega = -2 * 2 * Math.PI / 180;

    if (pumpkins.children.length >= maxPumpkinsCount)
        pumpkins.removeChild(pumpkins.children[0]);
    pumpkins.addChild(newPumpkin); 
}

function toggleBarrier() {
    if (mainCharacter.barrierSprite === null) {
        let circle = new PIXI.Graphics();
        mainCharacter.addChild(circle);
        mainCharacter.barrierSprite = circle;

        circle.lineStyle(5, 0x00ffff, 0.9);
        circle.drawCircle(0, 0, 48);
    }
    else {
        mainCharacter.removeChild(mainCharacter.barrierSprite);
        mainCharacter.barrierSprite = null;
    }
}