'use strict'

class PlayerInput {
    constructor() {
        // Capture keyboard arrow keys.
        this.left = new Keyboard("ArrowLeft");
        this.up = new Keyboard("ArrowUp");
        this.right = new Keyboard("ArrowRight");
        this.down = new Keyboard("ArrowDown");
        this.keyz = new Keyboard("z");
        this.keyx = new Keyboard("x");
    }

    get arrowX() {
        if (this.left.isDown) {
            if (this.right.isDown)
                return 0;
            else
                return -1;
        }
        else {
            if (this.right.isDown)
                return +1;
            else
                return 0;
        }
    }

    get arrowY() {
        if (this.up.isDown) {
            if (this.down.isDown)
                return 0;
            else
                return -1;
        }
        else {
            if (this.down.isDown)
                return +1;
            else
                return 0;
        }
    }

    get keyDownZ() {
        return this.keyz.isDown;
    }

    get keyDownX() {
        return this.keyx.isDown;
    }

    get pressedZ() {
        return this.keyz.pressed;
    }

    get pressedX() {
        return this.keyx.pressed;
    }
}

class Keyboard {
    constructor(value) {
        this.value = value;
        this.isDown = false;
        this.hasPressedHandled = false;
        this.keydown = undefined;
        this.keyup = undefined;

        this.downHandler = event => {
            if (event.key === this.value) {
                if (!this.isDown) {
                    this.hasPressedHandled = false;
                }
                this.isDown = true;
                event.preventDefault();
            }
        };
        this.upHandler = event => {
            if (event.key === this.value) {
                if (this.isDown) {
                    this.hasPressedHandled = false;
                }
                this.isDown = false;
                event.preventDefault();
            }
        };

        // Attach event listeners.
        window.addEventListener(
            "keydown", this.downHandler, false
        );
        window.addEventListener(
            "keyup", this.upHandler, false
        );
    }

    // Detach event listeners.
    unsubscribe() {
        window.removeEventListener("keydown", this.downHandler);
        window.removeEventListener("keyup", this.upHandler);
    }

    get pressed() {
        if (this.isDown && !this.hasPressedHandled) {
            this.hasPressedHandled = true;
            return true;
        }
        else
            return false;
    }
}

class TypingInput {
    constructor() {
        // Buffer to store pressed keys.
        this.inputs = [];

        // Handle key down events of non-repeat, case-insensitive
        // alphabet keys.
        // 
        // To prevent accidentally invoking shortcuts (e.g., Ctrl-R),
        // prevent default event handling for all such keys (children
        // may accidentally hit a shortcut key). If it is desired to
        // pass through shortcuts keys, do not call event.preventDefault()
        // when event.ctrlKey or event.altKey is true.
        this.downHandler = event => {
            const k = event.key[0].toUpperCase();
            const cc = k.charCodeAt(0);
            if (!event.repeat
                && event.key.length === 1
                && ((cc >= 65 && cc <= 90) || k === '-'))
            {
                this.inputs.push(k);
            }
            event.preventDefault();
        }

        window.addEventListener(
            'keydown', this.downHandler, false);
    }

    unsubscribe() {
        window.removeEventListener("keydown", this.downHandler);
    }

    getPressedKeys(c) {
        const inputs = this.inputs;
        this.inputs = [];
        return inputs;
    }
}