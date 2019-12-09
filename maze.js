'use strict'

let app;
let input;
let state;
let player;
let enemies;
let mazeScene;
let gameDoneScene;

const Directions = {
    down: 0,
    left: 1,
    right: 2,
    up: 3,

    reverse: dir => {
        if (dir === Directions.down) return Directions.up;
        if (dir === Directions.left) return Directions.right;
        if (dir === Directions.right) return Directions.left;
        if (dir === Directions.up) return Directions.down;
    }
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

    get canMoveForward() {
        let dx, dy;
        [dx, dy] = MazeCharacter.directionToSteps(this.direction);
        return this.maze.canMove(this.coords, dx, dy);
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
                this.direction = MazeCharacter.stepsToDirection(dx, dy);

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

    static stepsToDirection(dx, dy) {
        if (dx < 0) return Directions.left;
        if (dx > 0) return Directions.right;
        if (dy < 0) return Directions.up;
        if (dy > 0) return Directions.down;
    }

    static directionToSteps(direction) {
        if (direction === Directions.down) return [0, 1];
        if (direction === Directions.left) return [-1, 0];
        if (direction === Directions.right) return [1, 0];
        if (direction === Directions.up) return [0, -1];
    }

    static areHitRect(c1, c2) {
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
}

class EnemyCharacter extends MazeCharacter {
    constructor(maze, startPos, imgPath) {
        super(maze, startPos, imgPath);
    }

    moveEnemy(delta) {
        if (this.moveCounter > 0) {
            this.move(delta, 0, 0);
            return;
        }

        const branches = this.countBranches();
        const opposite = Directions.reverse(this.direction);
        if (branches === 1) {
            while (!this.canMoveForward)
                this.direction = (this.direction + 1) % 4;
        }
        else if (branches > 2 || !this.canMoveForward) {
            do {
                this.direction = Math.floor(Math.random() * 4);
            } while (!this.canMoveForward || this.direction === opposite);
        }

        let dx, dy;
        [dx, dy] = MazeCharacter.directionToSteps(this.direction);
        this.move(delta, dx, dy);
    }

    countBranches() {
        let n = 0;
        if (this.maze.canMove(this.coords, -1, 0)) n++;
        if (this.maze.canMove(this.coords, 1, 0)) n++;
        if (this.maze.canMove(this.coords, 0, -1)) n++;
        if (this.maze.canMove(this.coords, 0, 1)) n++;
        return n;
    }
}

function initScreen() {
    app = new PIXI.Application({ width: 640, height: 480 });
    app.loader
        .add([
            'images/majo.png',
            'images/kabocha.png',
        ])
        .load(setup);
    
    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup() {
    input = new PlayerInput();
    state = delta => { };
    app.ticker.add(gameLoop);

    gameDoneScene = new PIXI.Container();
    app.stage.addChild(gameDoneScene);
    
    let gameDoneMessage = new PIXI.Text(
        'Message',
        {
            fontFamily: 'Arial',
            fontSize: '36px',
            fill: '#ffffff',
            align: 'center',
        });
    gameDoneMessage.anchor.set(0.5);
    gameDoneScene.addChild(gameDoneMessage);
    gameDoneScene.message = gameDoneMessage;

    gameDoneScene.position.set(
        app.screen.width / 2,
        app.screen.height / 2);

    initPlay();
}

function gameLoop(delta) {
    state(delta);
}

function initPlay() {
    gameDoneScene.visible = false;
    app.stage.removeChild(mazeScene);

    // Create a scene container for the maze and characters.
    // To display messages above it, place it at a low index.
    let maze = new Maze(20, 30);
    mazeScene = maze.toPixiContainer();
    app.stage.addChildAt(mazeScene, 0);
    mazeScene.scale.set(0.5);
    mazeScene.position.set(
        (app.screen.width - mazeScene.width) / 2,
        (app.screen.height - mazeScene.height) / 2);

    player = new MazeCharacter(maze, { x: 0, y: 0 }, 'images/majo.png');
    mazeScene.addChild(player);

    if (maze.nx < 10) throw 'No space to place enemies.';
    enemies = [];
    for (let i = 0; i < 10; i++) {
        let startCoords;
        do {
            startCoords = {
                x: Math.floor(Math.random() * maze.nx),
                y: Math.floor(Math.random() * maze.ny)
            };
        } while (startCoords.x + startCoords.y < 10);
        let enemy = new EnemyCharacter(
            maze,
            startCoords,
            'images/kabocha.png');
        enemies.push(enemy);
        mazeScene.addChildAt(enemy);
    }

    state = play;
}

function play(delta) {
    player.move(delta, input.arrowX, input.arrowY);

    let isHit = false;
    enemies.forEach(enemy => {
        enemy.moveEnemy(delta);
        isHit |= MazeCharacter.areHitRect(player, enemy);
    });

    if (isHit)
        initGameOver();
}

function initGameOver() {
    gameDoneScene.visible = true;

    gameDoneScene.message.text = 'げーむおーばー\nもういちど あそぶには\nENTER キーを おして ください';

    state = gameDone;
}

function gameDone(delta) {
    if (input.pressedZ || input.pressedX || input.pressedEnter)
        initPlay();
}
