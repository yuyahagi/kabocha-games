'use strict'

import * as PIXI from 'pixi.js';
import { PlayerInput } from './keyboard';

let menu = {
    items: [
        { name: 'ひらがな', page: 'kana.html' },
        { name: 'かぼちゃ', page: 'pumpkins.html' },
        { name: 'めいろ', page: 'maze.html' },
    ],
    selected: 0
};

let app;
let input;
let state;

initScreen();

function initScreen() {
    app = new PIXI.Application({ width: 640, height: 480 });
    app.loader.load(setup);

    let mainDiv = document.getElementById('main');
    mainDiv.appendChild(app.view);
}

function setup(loader, resources) {
    input = new PlayerInput();

    let instructionMessage = new PIXI.Text(
        'なにして あそぶ？',
        {
            fontFamily: 'Arial',
            fontSize: '36px',
            fill: "#FFFFFF",
            align: 'center',
        });
    instructionMessage.anchor.set(0.5);
    instructionMessage.position.set(
        app.screen.width / 2,
        app.screen.height / 5);
    app.stage.addChild(instructionMessage);

    const y0 = app.screen.height / 3;

    menu.items.forEach((item, idx) => {
        let sprite = new PIXI.Text(
            item.name,
            {
                fontFamily: 'Arial',
                fontSize: '36px',
                fill: "#FF4040",
                align: 'center',
            });
        sprite.anchor.set(0.5);
        sprite.position.set(
            app.screen.width / 2,
            y0 + 48 * idx);
        
        item.sprite = sprite;
        app.stage.addChild(item.sprite);
    });

    app.ticker.add(delta => gameLoop(delta));

    state = play;
}

function gameLoop(delta) {
    state(delta);
}

function play(delta) {
    menu.selected += input.pressedArrowY;
    if (menu.selected < 0)
        menu.selected = 0;
    if (menu.selected >= menu.items.length)
        menu.selected = menu.items.length - 1;

    if (input.pressedEnter　|| input.pressedZ || input.pressedX) {
        const page = menu.items[menu.selected].page;
        window.open(page, '_self');
    }

    updateMenuSelection();
}

function updateMenuSelection() {
    menu.items.forEach((item, idx) => {
        const textColor = idx === menu.selected
            ? '#FFFFFF'
            : '#404040';
        item.sprite.style.fill = textColor;
    });
}
