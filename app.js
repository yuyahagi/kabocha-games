'use strict'

function initScreen() {
    let app = new PIXI.Application({ width: 640, height: 480 });

    PIXI.Loader.shared
        .add([
            "images/obake.png",
            "images/obake_kage.png"
        ])
        .load(() => {
            let rectangle = new PIXI.Rectangle(0, 32, 32, 32);
            let texture = PIXI.utils.TextureCache["images/obake.png"];
            texture.frame = rectangle;
            let obake = new PIXI.Sprite(texture);
            
            obake.anchor.set(0.5, 0.5);
            obake.position.set(320, 240);
            obake.scale.set(2, 2);
            obake.rotation = 0.1;
            
            app.stage.addChild(obake);
            app.renderer.render(app.stage);
        });

    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}
