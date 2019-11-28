'use strict'

let app;
let playerSpeed = 10;
let initialPumpkins = 1;
let maxPumpkinsCount = 10;
let maxPumpkinsSpeed = 15;
let timeBeforeNextPumpkin_s = 5;

let CharacterImagePaths = {
    ghost: "images/obake.png",
    pumpkin: "images/kabocha.png"
};

class Character extends PIXI.Container {
    constructor(imgPath, x, y) {
        super();
        let sprite = loadSprite(imgPath, new PIXI.Rectangle(0, 32, 32, 32));
        this.addChild(sprite);
        this.position.set(x, y);
        this.rotation = 0;

        this.dx = 0;
        this.dy = 0;
        this.omega = 0;
        this.hp = 50;
        this.maxHp = 50;
    }

    static isHit(c1, c2) {
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
};

class HpBar extends PIXI.Container {
    constructor(maxHp) {
        super();
        
        this.maxHp = maxHp;
        this.barSizeX = 640;
        this.barSizeY = 8;

        let back = new PIXI.Graphics();
        back.beginFill(0xa0a0a0);
        back.drawRect(0, 0, this.width, this.barSizeY);
        back.endFill();
        this.addChild(back);

        let front = new PIXI.Graphics();
        this.addChild(front);
        front.beginFill(0x00aa00, 0.5);
        front.drawRect(0, 0, this.barSizeX, this.barSizeY);
        front.endFill();

        this.front = front;
    }

    update(hp) {
        this.front.width = this.barSizeX * hp / this.maxHp;
    }
}

let pumpkins;
let player;
let hpBar;
let input;
let startTime;
let state = play;

function initScreen() {
    app = new PIXI.Application({ width: 640, height: 480 });
    app.loader
        .add([
            CharacterImagePaths.ghost,
            CharacterImagePaths.pumpkin,
        ])
        .load(setup);

    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup(loader, resources) {
    input = new PlayerInput();
    initPlay();
    app.ticker.add(delta => gameLoop(delta));
}

function initPlay() {
    while (app.stage.children.length > 0) {
        app.stage.removeChildAt(app.stage.children.length - 1);
    }

    player = new Character(CharacterImagePaths.ghost, 0.6 * app.screen.width, 0.6 * app.screen.height);
    player.omega = 0.2 * 2 * Math.PI / 60;
    player.barrierSprite = null;

    hpBar = new HpBar(player.maxHp);
    app.stage.addChild(hpBar);

    pumpkins = new PIXI.Container();
    for (let i = 0; i < initialPumpkins; i++)
        addPumpkin();

    app.stage.addChild(player);
    app.stage.addChild(pumpkins);

    startTime = app.ticker.lastTime;

    state = play;
}

function loadSprite(imgPath, rectangle) {
    let texture = PIXI.utils.TextureCache[imgPath];
    texture.frame = rectangle;
    let sprite = new PIXI.Sprite(texture);

    sprite.anchor.set(0.5, 0.5);
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
    movePlayer(delta);

    let phase = 1 + Math.floor(0.001 * (app.ticker.lastTime - startTime) / timeBeforeNextPumpkin_s);
    if (phase > maxPumpkinsCount) {
        initGameClear();
    }

    if (phase > pumpkins.children.length)
        addPumpkin();

    let isHit = false;
    pumpkins.children.forEach(element => {
        moveSprite(element, delta, true);
        if (Character.isHit(player, element)) {
            isHit = true;
            player.hp--;
        }
    });

    if (isHit)
        toggleBarrier(player);
    else
        hideBarrier(player);
    
    hpBar.update(player.hp);
    
    if (player.hp <= 0) {
        initGameover();
    }
}

function movePlayer(delta) {
    player.dx = playerSpeed * input.arrowX;
    player.dy = playerSpeed * input.arrowY;

    if (input.pressedZ)
        addPumpkin();
    
    moveSprite(player, delta);

    if (player.x < 0) player.x = 0;
    if (player.x > 640) player.x = 640;
    if (player.y < 0) player.y = 0;
    if (player.y > 480) player.y = 480;
}

function moveSprite(sprite, delta, toBounce = false) {
    sprite.x += sprite.dx * delta;
    sprite.y += sprite.dy * delta;
    sprite.rotation += sprite.omega * delta;

    if (toBounce) {
        if (sprite.x < 10 || sprite.x > 630) sprite.dx *= -1;
        if (sprite.y < 10 || sprite.y > 470) sprite.dy *= -1;
    }
}

function addPumpkin() {
    let newPumpkin = new Character(CharacterImagePaths.pumpkin, player.x, player.y);
    newPumpkin.position.set(20, 20);
    newPumpkin.dx = maxPumpkinsSpeed * 2 * (Math.random() - 0.5);
    newPumpkin.dy = maxPumpkinsSpeed * 2 * (Math.random() - 0.5);
    newPumpkin.omega = -2 * 2 * Math.PI / 180;

    if (pumpkins.children.length >= maxPumpkinsCount)
        pumpkins.removeChild(pumpkins.children[0]);
    pumpkins.addChild(newPumpkin);
}

function toggleBarrier(character) {
    if (character.barrierSprite === null) {
        showBarrier(character);
    }
    else {
        hideBarrier(character);
    }
}

function showBarrier(character) {
    if (character.barrierSprite !== null) return;

    let circle = new PIXI.Graphics();
    character.addChild(circle);
    character.barrierSprite = circle;

    circle.lineStyle(5, 0x00ffff, 0.9);
    circle.drawCircle(0, 0, 48);
}

function hideBarrier(character) {
    if (character.barrierSprite === null) return;

    character.removeChild(character.barrierSprite);
    character.barrierSprite = null;
}

function gameOver(delta) {
    if (input.pressedZ) {
        initPlay();
    }
}

function initGameover() {
    let msg = new PIXI.Text(
        'げーむおーばー\nもう一回あそぶ (z)',
        {
            fontFamily: 'Arial',
            fontSize: '36px',
            fill: "#FFFFFF",
            align: 'center',
        });
    msg.anchor.set(0.5);
    msg.position.set(app.screen.width / 2, app.screen.height / 2);
    app.stage.addChild(msg);
    state = gameOver;
}

function gameClear(delta) {
    if (input.pressedZ)
        initPlay();
}

function initGameClear() {
    let msg = new PIXI.Text(
        'くりあ\nもう一回遊ぶ (z)',
        {
            fontFamily: 'Arial',
            fontSize: '36px',
            fill: '#FFFFFF',
            align: 'center'
        }
    );
    msg.anchor.set(0.5);
    msg.position.set(app.screen.width / 2, app.screen.height / 2);
    app.stage.addChild(msg);
    state = gameClear;
}