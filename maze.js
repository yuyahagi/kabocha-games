'use strict'

let app;
let input;
let state;

function initScreen() {
    app = new PIXI.Application({ width: 640, height: 480 });
    app.loader
        .load(setup);
    
    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup() {
    input = new PlayerInput();
    
    let maze = new Maze(21, 31);
    let mazeSprite = maze.toPixiContainer();//drawMaze(maze.array);

    mazeSprite.position.set(0, 0);
    mazeSprite.scale.set(1);

    app.stage.addChild(mazeSprite);


    state = play;

    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
    state(delta);
}

function play(delta) {
}