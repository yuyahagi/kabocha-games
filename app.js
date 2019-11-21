'use strict'

let app = new PIXI.Application({ width: 640, height: 480 });
let maxPumpkinsCount = 10;
let characters;
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
    mainCharacter = loadSprite("images/obake.png", new PIXI.Rectangle(0, 32, 32, 32));
    
    characters = new PIXI.Container();
    addPumpkin();

    app.stage.addChild(mainCharacter);
    app.stage.addChild(characters);

    // Capture keyboard arrow keys.
    let left = keyboard("ArrowLeft"),
        up = keyboard("ArrowUp"),
        right = keyboard("ArrowRight"),
        down = keyboard("ArrowDown"),
        space = keyboard(" ");
    
    let sp = 5;
    left.press = () => { mainCharacter.vx -= sp; }
    up.press = () => { mainCharacter.vy -= sp; }
    right.press = () => { mainCharacter.vx += sp; }
    down.press = () => { mainCharacter.vy += sp; }
    left.release = () => { mainCharacter.vx = 0; mainCharacter.vy = 0 }
    up.release = () => { mainCharacter.vx = 0; mainCharacter.vy = 0 }
    right.release = () => { mainCharacter.vx = 0; mainCharacter.vy = 0 }
    down.release = () => { mainCharacter.vx = 0; mainCharacter.vy = 0 }
    space.press = () => { addPumpkin(); }

    app.ticker.add(delta => gameLoop(delta));
}

function loadSprite(imgPath, rectangle) {
    let texture = PIXI.utils.TextureCache[imgPath];
    texture.frame = rectangle;
    let sprite = new PIXI.Sprite(texture);

    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(320, 240);
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
    characters.children.forEach(element => {
        moveSprite(element, delta, true);
    });
    moveSprite(mainCharacter, delta);

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

    if (characters.children.length >= maxPumpkinsCount)
        characters.removeChild(characters.children[0]);
    characters.addChild(newPumpkin); 
}
