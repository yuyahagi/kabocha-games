'use strict'

let app = new PIXI.Application({ width: 640, height: 480 });
let obake;
let state = play;

function initScreen() {
    app.loader
        .add([
            "images/obake.png",
            "images/obake_kage.png"
        ])
        .load(setup);

    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup(loader, resources) {
    let rectangle = new PIXI.Rectangle(0, 32, 32, 32);
    let texture = PIXI.utils.TextureCache["images/obake.png"];
    texture.frame = rectangle;
    obake = new PIXI.Sprite(texture);

    obake.anchor.set(0.5, 0.5);
    obake.position.set(320, 240);
    obake.scale.set(2, 2);
    obake.rotation = 0.1;

    obake.vx = 0;
    obake.vy = 0;
    
    app.stage.addChild(obake);
    
    // Capture keyboard arrow keys.
    let left = keyboard("ArrowLeft"),
        up = keyboard("ArrowUp"),
        right = keyboard("ArrowRight"),
        down = keyboard("ArrowDown");
    
    left.press = () => { obake.vx -= 1; }
    up.press = () => { obake.vy -= 1; }
    right.press = () => { obake.vx += 1; }
    down.press = () => { obake.vy += 1; }
    // left.release = () => { obake.vx = 0; obake.vy = 0 }
    // up.release = () => { obake.vx = 0; obake.vy = 0 }
    // right.release = () => { obake.vx = 0; obake.vy = 0 }
    // down.release = () => { obake.vx = 0; obake.vy = 0 }

    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
    state(delta);
}

function play(delta) {
    obake.x += obake.vx * (1 + delta);
    obake.y += obake.vy * (1 + delta);
}
