'use strict'

let app = new PIXI.Application({ width: 640, height: 480 });
let obake;

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

    app.stage.addChild(obake);
    app.renderer.render(app.stage);
    
    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
    obake.x += 2 + delta;
}