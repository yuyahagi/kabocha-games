'use strict'

function getCanvas() {
    let app = new PIXI.Application({ width: 256, height: 256 });
    return app.view;
}

let app = new PIXI.Application({ width: 256, height: 256 });
app.renderer.backgroundColor = 0x061639;
document.body.appendChild(app.view);
