'use strict'

class PlayerInput {
    constructor() {
        console.log('PlayerInput constructor.');
        this.keyPressedLeft = false;
        this.keyPressedUp = false;
        this.keyPressedRight = false;
        this.keyPressedDown = false;
        this.keyPressedZ = false;
        this.keyPressedX = false;

        // Capture keyboard arrow keys.
        this.left = keyboard("ArrowLeft"),
        this.up = keyboard("ArrowUp"),
        this.right = keyboard("ArrowRight"),
        this.down = keyboard("ArrowDown"),
        this.keyz = keyboard("z"),
        this.keyx = keyboard("x");

        this.left.press = () => { this.keyPressedLeft = true; }
        this.up.press = () => { this.keyPressedUp = true; }
        this.right.press = () => { this.keyPressedRight= true; }
        this.down.press = () => { this.keyPressedDown = true; }
        this.left.release = () => { this.keyPressedLeft = false; }
        this.up.release = () => { this.keyPressedUp = false; }
        this.right.release = () => { this.keyPressedRight = false; }
        this.down.release = () => { this.keyPressedDown = false; }

        this.keyz.press = () => { this.keyPressedZ = true; };
        this.keyz.release = () => { this.keyPressedZ = false; };
        this.keyx.press = () => { this.keyPressedX = true; };
        this.keyx.release = () => { this.keyPressedX = false; };
    }

    get arrowX() {
        if (this.keyPressedLeft) {
            if (this.keyPressedRight)
                return 0;
            else
                return -1;
        }
        else {
            if (this.keyPressedRight)
                return +1;
            else
                return 0;
        }
    }

    get arrowY() {
        if (this.keyPressedUp) {
            if (this.keyPressedDown)
                return 0;
            else
                return -1;
        }
        else {
            if (this.keyPressedDown)
                return +1;
            else
                return 0;
        }
    }

    get keyZ() {
        let pressed = this.keyPressedZ;
        this.keyPressedZ = false;
        return pressed;
    }

    get keyX() {
        let pressed = this.keyPressedX;
        this.keyPressedX = false;
        return pressed;
    }
}

function keyboard(value) {
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;

    key.downHandler = event => {
        if (event.key === key.value) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };
    key.upHandler = event => {
        if (event.key === key.value) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
            event.preventDefault();
        }
    };

    // Attach event listeners.
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);

    window.addEventListener(
        "keydown", downListener, false
    );
    window.addEventListener(
        "keyup", upListener, false
    );

    // Detach event listeners.
    key.unsubscribe = () => {
        window.removeEventListener("keydown", downListener);
        window.removeEventListener("keyup", uplistener);
    };

    return key;
}
