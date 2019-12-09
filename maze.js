'use strict'

let app;
let input;
let state;
let player;

const Directions = {
    down: 0,
    left: 1,
    right: 2,
    up: 3
};

class MazeCharacter extends PIXI.Container {
    constructor(maze, startPos, imgPath) {
        super();

        // Associated Maze object
        this.maze = maze;

        // X and Y coordinates in the maze and direction.
        // The last coordinates are used for smoothly moving the sprite.
        this.coords = { x: startPos.x, y: startPos.y };
        this.lastCoords = { x: startPos.x, y: startPos.y };
        this.direction = Directions.down;

        // Iterations for a single move.
        this.moveTime = 15;

        // A counter for smoothly moving to the next position.
        this.moveCounter = 0;

        // For debugging.
        let currentCell = new PIXI.Graphics();
        currentCell.beginFill(0x00ff00, 0.5);
        currentCell.drawRect(0, 0, this.maze.cellsize, this.maze.cellsize);
        currentCell.visible = false;
        this.currentCell = currentCell;
        this.addChild(currentCell);

        // Character sprite.
        let texture = PIXI.utils.TextureCache[imgPath];
        texture.frame = new PIXI.Rectangle(0, 0, 32, 32);
        let sprite = new PIXI.Sprite(texture);
        this.addChild(sprite);
        
        const position = maze.indexToPosition(this.coords.y, this.coords.x);
        this.position = position;
    }

    move(delta, inputx, inputy) {
        if (this.moveCounter <= 0) {
            // Player being stopped.
            let dx = 0;
            let dy = 0;
            if (inputx !== 0 && inputy !== 0) {
                // Diagonal direction input.
                // To walk player zig-zag, try to turn to side if possible.
                if (this.direction === Directions.down || this.direction === Directions.up) {
                    if (this.maze.canMove(this.coords, inputx, 0))
                        dx = inputx;
                    else if (this.maze.canMove(this.coords, 0, inputy))
                        dy = inputy;
                }
                else {
                    if (this.maze.canMove(this.coords, 0, inputy))
                        dy = inputy;
                    else if (this.maze.canMove(this.coords, inputx, 0))
                        dx = inputx;
                }
            }
            else {
                if (this.maze.canMove(this.coords, inputx, 0))
                    dx = inputx;
                if (this.maze.canMove(this.coords, 0, inputy))
                    dy = inputy;
            }

            if (dx !== 0 || dy !== 0) {
                this.lastCoords.x = this.coords.x;
                this.lastCoords.y = this.coords.y;
                this.coords.x += dx;
                this.coords.y += dy;
                this.direction = this.stepsToDirection(dx, dy);

                this.moveCounter = this.moveTime;
            }
        }
        else {
            this.moveCounter -= delta;
            if (this.moveCounter < 0) this.moveCounter = 0;
        }

        const p0 = this.maze.indexToPosition(this.lastCoords.y, this.lastCoords.x);
        const p = this.maze.indexToPosition(this.coords.y, this.coords.x);
        this.position.x = p .x - this.moveCounter / this.moveTime * (p.x - p0.x);
        this.position.y = p .y - this.moveCounter / this.moveTime * (p.y - p0.y);

        this.currentCell.position.x = p.x - this.position.x;
        this.currentCell.position.y = p.y - this.position.y;
    }

    stepsToDirection(dx, dy) {
        if (dx < 0) return Directions.left;
        if (dx > 0) return Directions.right;
        if (dy < 0) return Directions.down;
        if (dy > 0) return Directions.up;
    }
}

function initScreen() {
    app = new PIXI.Application({ width: 640, height: 480 });
    app.loader
        .add([
            'images/majo.png'
        ])
        .load(setup);
    
    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup() {
    input = new PlayerInput();
    
    let maze = new Maze(15, 20);
    let mazeSprite = maze.toPixiContainer();//drawMaze(maze.array);
    app.stage.addChild(mazeSprite);
    mazeSprite.scale.set(0.75);
    mazeSprite.position.set(
        (app.screen.width - mazeSprite.width) / 2,
        (app.screen.height - mazeSprite.height) / 2);

    player = new MazeCharacter(maze, { x: 0, y: 0 }, 'images/majo.png');
    mazeSprite.addChild(player);

    state = play;
    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
    state(delta);
}

function play(delta) {
    player.move(delta, input.arrowX, input.arrowY);
}