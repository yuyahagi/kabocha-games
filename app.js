'use strict'

function initScreen() {
    let app = new PIXI.Application({ width: 640, height: 480 });

    PIXI.Loader.shared
        .add([
            "images/obake.png",
            "images/obake_kage.png"
        ])
        .load(() => {
            let obake = new PIXI.Sprite(PIXI.Loader.shared.resources["images/obake.png"].texture);
            app.stage.addChild(obake);
        });

    // let mainDiv = document.getElementById('main');
    // mainDiv.appendChild(app.view);
    document.body.appendChild(app.view);
}
