'use strict'

import * as PIXI from 'pixi.js';
import { PlayerInput } from './keyboard';
import { Maze } from './mazegen';
import { Word } from './word';

const characterSpeed = 5;

let app;
let input;
let state;
let player;
let enemies;
let items;
let letters;
let pathToPlayer;
let currentLevel;
let levels;
let problemWords;
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

initScreen();

class MazeObject extends PIXI.Container {
    constructor(maze, coords, sprite) {
        super();
        // Associated Maze object
        this.maze = maze;

        // X and Y coordinates in the maze and direction.
        this.coords = { x: coords.x, y: coords.y };
        const position = maze.indexToPosition(this.coords.y, this.coords.x);
        // this.position = position;
        sprite.anchor.set(0.5);
        this.position.set(
            position.x + maze.cellsize / 2,
            position.y + maze.cellsize / 2);

        this.sprite = sprite;
        this.addChild(sprite);

        this.invincible = false;

        this.disappearTime = 15;
        this.disappearCounter = 0;
    }

    update(delta) {
        if (this.disappearCounter > 0) {
            let t = 1 - this.disappearCounter / this.disappearTime;
            this.sprite.scale.set(1 + t);
            this.sprite.rotation = 10 * t ** 2;
            this.disappearCounter -= delta;
            if (this.disappearCounter < 0) {
                this.disappearCounter = 0;
                this.parent.removeChild(this);
            }
        }
    }

    disappear() {
        this.invincible = true;
        this.disappearCounter = this.disappearTime;
    }

    static areHitRect(c1, c2) {
        if (c1.invincible || c2.invincible)
            return false;
        
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

class MazeCharacter extends MazeObject {
    constructor(maze, startPos, directionTextures) {
        // Character sprite.
        let sprite = new PIXI.AnimatedSprite(directionTextures[Directions.down]);
        sprite.animationSpeed = 0.1;
        sprite.play();
        super(maze, startPos, sprite);

        this.directionTextures = directionTextures;

        // The last coordinates are used for smoothly moving the sprite.
        this.lastCoords = { x: startPos.x, y: startPos.y };
        this.direction = Directions.down;

        // Iterations for a single move.
        this.moveTime = 60 / characterSpeed;

        // Counters for smoothly moving to the next position.
        this.moveCounter = 0;

        // For debugging.
        let currentCell = new PIXI.Graphics();
        currentCell.beginFill(0x00ff00, 0.5);
        currentCell.drawRect(0, 0, this.maze.cellsize, this.maze.cellsize);
        currentCell.visible = false;
        this.currentCell = currentCell;
        this.addChild(currentCell);

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

            let newDirection;
            if (dx !== 0 || dy !== 0) {
                this.lastCoords.x = this.coords.x;
                this.lastCoords.y = this.coords.y;
                this.coords.x += dx;
                this.coords.y += dy;
                newDirection = this.stepsToDirection(dx, dy);

                this.moveCounter = this.moveTime;
            }
            else {
                newDirection = this.stepsToDirection(inputx, inputy);
            }

            // When changing direction, change the animation textures too.
            if (newDirection !== this.direction) {
                this.direction = newDirection;
                this.sprite.textures = this.directionTextures[newDirection];
                this.sprite.play();
            }
        }
        else {
            this.moveCounter -= delta;
            if (this.moveCounter < 0) this.moveCounter = 0;
        }

        const p0 = this.maze.indexToPosition(this.lastCoords.y, this.lastCoords.x);
        const p = this.maze.indexToPosition(this.coords.y, this.coords.x);
        this.position.set(
            this.maze.cellsize / 2 + p.x - this.moveCounter / this.moveTime * (p.x - p0.x),
            this.maze.cellsize / 2 + p.y - this.moveCounter / this.moveTime * (p.y - p0.y));

        this.currentCell.position.x = p.x - this.position.x;
        this.currentCell.position.y = p.y - this.position.y;

        const moved = (this.coords !== this.lastCoords);
        return moved;
    }

    stepsToDirection(dx, dy) {
        if (dx < 0) return Directions.left;
        if (dx > 0) return Directions.right;
        if (dy < 0) return Directions.up;
        if (dy > 0) return Directions.down;
        return this.direction;
    }

    static directionToSteps(direction) {
        if (direction === Directions.down) return [0, 1];
        if (direction === Directions.left) return [-1, 0];
        if (direction === Directions.right) return [1, 0];
        if (direction === Directions.up) return [0, -1];
    }

}

class EnemyCharacter extends MazeCharacter {
    constructor(maze, startPos, directionTextures) {
        super(maze, startPos, directionTextures);
    }

    moveEnemy(delta) {
        if (this.moveCounter > 0) {
            this.move(delta, 0, 0);
            return;
        }

        const branches = this.countBranches();
        const opposite = Directions.reverse(this.direction);
        let newDirection = this.direction;
        if (branches === 1) {
            while (!this.maze.canMoveToward(this.coords, newDirection))
                newDirection = (newDirection + 1) % 4;
        }
        else if (branches > 2 || !this.canMoveForward) {
            do {
                newDirection = Math.floor(Math.random() * 4);
            } while (!this.maze.canMoveToward(this.coords, newDirection)
                || newDirection === opposite);
        }

        let dx, dy;
        [dx, dy] = MazeCharacter.directionToSteps(newDirection);
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

class ChasingEnemyCharacter extends EnemyCharacter {
    constructor(maze, startPos, directionTextures, pathToPlayer) {
        super(maze, startPos, directionTextures);
        this.pathToPlayer = pathToPlayer;
    }

    moveEnemy(delta) {
        if (this.moveCounter > 0) {
            this.move(delta, 0, 0);
            return;
        }

        let newDirection = Directions.down;
        let stepsToPlayer = 0x7fffffff;
        for (let dir = 0; dir < 4; dir++) {
            let dx, dy;
            [dx, dy] = MazeCharacter.directionToSteps(dir);
            const idx = (this.coords.y + dy) * this.maze.nx + this.coords.x + dx;
            if (this.maze.canMoveToward(this.coords, dir) && this.pathToPlayer.paths[idx] < stepsToPlayer) {
                stepsToPlayer = this.pathToPlayer.paths[idx];
                newDirection = dir;
            }
        }

        let dx, dy;
        [dx, dy] = MazeCharacter.directionToSteps(newDirection);
        this.move(delta, dx, dy);
    }
}


class ShortestPath {
    constructor(maze, coords) {
        this.maze = maze;
        this.nx = maze.nx;
        this.ny = maze.ny;
        this.paths = new Array(maze.ny * maze.nx);
        
        this.update(coords);
    }
    
    update(coords) {
        const INF = 100000000;
        // let paths = this.paths.fill(INF);
        for (let i = 0; i < this.paths.length; i++) {
            this.paths[i] = INF;
        }
        let q = [];
        let nx = this.nx;
        this.paths[coords.y * nx + coords.x] = 0;
        q.push(coords);
        while (q.length > 0) {
            let cur = q[0];
            let d = this.paths[cur.y * nx + cur.x] + 1;
            q = q.slice(1);

            const dpos = [[0, -1], [0, 1], [-1, 0], [1, 0]];
            dpos.forEach(([dx, dy]) => {
                const v = (cur.y + dy) * nx + (cur.x + dx);
                if (this.paths[v] === INF && this.maze.canMove(cur, dx, dy)) {
                    this.paths[v] = d;
                    q.push({ x: cur.x + dx, y: cur.y + dy });
                }
            });
        }
    }
}

function initScreen() {
    app = new PIXI.Application({ width: 640, height: 480 });
    app.loader
        .add('levels', 'mazelevels.json')
        .add('problemWords', 'words.json')
        .add([
            "images/majo.json",
            'images/kabocha.json',
        ])
        .load(setup);
    
    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup(loader, resources) {
    levels = resources.levels.data.levels;
    problemWords = resources.problemWords.data.words;

    currentLevel = 0;

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
    app.stage.removeChild(letters);

    let level = levels[currentLevel];

    // Create a scene container for the maze and characters.
    // To display messages above it, place it at a low index.
    let maze = new Maze(level.ny, level.nx, level.loops);
    mazeScene = maze.toPixiContainer();
    app.stage.addChildAt(mazeScene, 0);
    mazeScene.scale.set(0.7);
    mazeScene.position.set(
        (app.screen.width - mazeScene.width) / 2,
        ((app.screen.height - 48) - mazeScene.height) / 2);

    // Place items in the maze.
    items = [];
    let problemWord;
    let xpos, ypos;
    if (level.tutorial) {
        problemWord = "もじをあつめてね";
        level.letters = problemWord.length;
        level.enemies = 0;

        xpos = i => 2 + i;
        ypos = i => 0;
    }
    else {
        do {
            let idx = Math.floor(Math.random() * problemWords.length);
            problemWord = problemWords[idx];
        } while (problemWord.length != level.letters);

        xpos = i => Math.floor(Math.random() * maze.nx);
        ypos = i => Math.floor(Math.random() * maze.ny);
    }
    for (let i = 0; i < level.letters; i++) {
        let x, y;
        do {
            x = xpos(i);
            y = ypos(i);
        } while (items.some(item => item.coords.x == x && item.coords.y == y));
        let item = new MazeObject(
            maze,
            {
                x: x,
                y: y
            },
            new PIXI.Text(
                problemWord[i],
                {
                    fontFamily: 'Arial',
                    fontSize: '32px',
                    fill: '#ffffff'
                }));
        items.push(item);
        mazeScene.addChild(item);
    }

    letters = new Word(problemWord, 32, false);
    letters.pivot.set(letters.width / 2, 0);
    letters.position.set(
        app.screen.width / 2,
        app.screen.height - 48);
    app.stage.addChild(letters);

    const playerStartPos = { x: 0, y: 0 };
    pathToPlayer = new ShortestPath(maze, playerStartPos);

    enemies = [];
    if (level.enemies > 0) {
        if (maze.nx + maze.ny < 10) throw 'No space to place enemies.';
        let directionTextures = new Array(4);
        directionTextures[Directions.down]
            = [PIXI.utils.TextureCache['kabocha_down_2.png']];
        directionTextures[Directions.left]
            = [PIXI.utils.TextureCache['kabocha_left_2.png']];
        directionTextures[Directions.right]
            = [PIXI.utils.TextureCache['kabocha_right_2.png']];
        directionTextures[Directions.up]
            = [PIXI.utils.TextureCache['kabocha_up_2.png']];

        for (let i = 0; i < level.enemies; i++) {
            let startCoords;
            do {
                startCoords = {
                    x: Math.floor(Math.random() * maze.nx),
                    y: Math.floor(Math.random() * maze.ny)
                };
            } while (startCoords.x + startCoords.y < 10);
            let enemy;
            if (level.chase) {
                enemy = new ChasingEnemyCharacter(
                    maze, startCoords, directionTextures, pathToPlayer);
            } else {
                enemy = new EnemyCharacter(maze, startCoords, directionTextures);
            }
            enemy.moveTime /= level.speed;
            enemies.push(enemy);
            mazeScene.addChild(enemy);
        }
    }

    // Load animation frames for player sprite.
    let playerTextures = new Array(4);
    playerTextures[Directions.down] = [];
    for (let f = 0; f < 3; f++) {
        let texture = PIXI.utils.TextureCache[`majo_down_${f + 1}.png`];
        playerTextures[Directions.down].push(texture);
    }
    playerTextures[Directions.left] = [];
    for (let f = 0; f < 3; f++) {
        let texture = PIXI.utils.TextureCache[`majo_left_${f + 1}.png`];
        playerTextures[Directions.left].push(texture);
    }
    playerTextures[Directions.right] = [];
    for (let f = 0; f < 3; f++) {
        let texture = PIXI.utils.TextureCache[`majo_right_${f + 1}.png`];
        playerTextures[Directions.right].push(texture);
    }
    playerTextures[Directions.up] = [];
    for (let f = 0; f < 3; f++) {
        let texture = PIXI.utils.TextureCache[`majo_up_${f + 1}.png`];
        playerTextures[Directions.up].push(texture);
    }

    player = new MazeCharacter(maze, playerStartPos, playerTextures);
    mazeScene.addChild(player);

    state = play;
}

function play(delta) {
    if (input.pressedEsc)
        goToLauncher();

    const playerMoved = player.move(delta, input.arrowX, input.arrowY);

    // When moving player, update the shortest path to each cell.
    if (playerMoved) {
        pathToPlayer.update(player.coords);
    }

    items.forEach((item, index) => {
        item.update(delta);
        if (MazeObject.areHitRect(player, item)) {
            if (letters.fill(item.sprite.text))
                item.disappear();
            if (letters.allFilled)
                player.invincible = true;
        }
    });

    let isHit = false;
    enemies.forEach(enemy => {
        enemy.moveEnemy(delta);
        isHit |= MazeObject.areHitRect(player, enemy);
    });

    if (letters.allFilled && player.moveCounter <= 0) {
        initLevelClear();
    }

    if (isHit) {
        player.sprite.stop();
        initGameOver();
    }
}

function initLevelClear() {
    gameDoneScene.visible = true;
    if (currentLevel < levels.length - 1) {
        gameDoneScene.message.text = `すてーじ ${currentLevel} くりあ`;
        ++currentLevel;
    }
    else {
        gameDoneScene.message.text = `すべての すてーじ くりあ`;
        currentLevel = 0;
    }

    // Reset input to prevent immediately moving on.
    input.pressedArrowX;
    input.pressedArrowY;
    input.pressedZ;
    input.pressedX;
    input.pressedEnter;
    state = gameDone;
}

function initGameOver() {
    gameDoneScene.visible = true;
    gameDoneScene.message.text = `すてーじ ${currentLevel} げーむおーばー`;

    // Reset input to prevent immediately moving on.
    input.pressedArrowX;
    input.pressedArrowY;
    input.pressedZ;
    input.pressedX;
    input.pressedEnter;
    state = gameDone;
}

function gameDone(delta) {
    if (input.pressedEsc)
        goToLauncher();
    
    if (input.pressedArrowX
        || input.pressedArrowY
        || input.pressedZ
        || input.pressedX
        || input.pressedEnter)
        initPlay();
    items.forEach(item => item.update(delta));
}

function goToLauncher() {
    window.open('index.html', '_self');
}
