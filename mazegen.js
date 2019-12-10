'use strinc'

class Maze {
    constructor(ny, nx) {
        // Size of maze.
        this.nx = nx;
        this.ny = ny;

        // Size of inner array for the maze.
        this._innerNx = 2 * nx + 1;
        this._innerNy  = 2 * ny + 1;
        this.cellsize = 36;
        this.wallwidth = 4;

        if (nx < 3 || ny < 3)
            throw 'Maze width and height must be >= 3 but were ' + ny + ' by ' + nx;

        // Initialize 2d array.
        let maze = new Array(this._innerNy * this._innerNx);
        maze = maze.fill(0);
        for (let i = 0; i < this._innerNy; i++) {
            // Left and right walls.
            maze[i * this._innerNx + 0] = 1;
            maze[(i + 1) * this._innerNx - 1] = 1;
        }
        // Top and bottom walls.
        maze.fill(1, 0, this._innerNx);
        maze.fill(1, (this._innerNy - 1) * this._innerNx, this._innerNy * this._innerNx);

        generateMaze(maze, this._innerNy, this._innerNx);

        this.array = maze;
    }

    indexToPosition(i, j) {
        return {
            x: (j + 1) * this.wallwidth + j * this.cellsize,
            y: (i + 1) * this.wallwidth + i * this.cellsize
        };
    }

    canMove(coords, dx, dy) {
        const j = 2 * coords.x + 1 + dx;
        const i = 2 * coords.y + 1 + dy;
        return this.array[i * this._innerNx + j] === 0;
    }

    canMoveToward(coords, direction) {
        if (direction === Directions.down) return this.canMove(coords, 0, 1);
        if (direction === Directions.left) return this.canMove(coords, -1, 0);
        if (direction === Directions.right) return this.canMove(coords, 1, 0);
        if (direction === Directions.up) return this.canMove(coords, 0, -1);
    }

    toPixiContainer() {
        // Original wall sprite (square graphic).
        let wall0 = new PIXI.Graphics();
        wall0.beginFill(0x808080);
        wall0.drawRect(0, 0, 1, 1);
        wall0.endFill();

        // Add cloned wall sprites to container.
        let mazeSprite = new PIXI.Container();
        const placeCell = (pos, di, dj) => {
            let w = wall0.clone();
            w.position.set(
                pos.x + dj * this.wallwidth,
                pos.y + di * this.wallwidth);
            w.width = dj % 2 == 0 ? this.cellsize : this.wallwidth;
            w.height = di % 2 == 0 ? this.cellsize : this.wallwidth;
            mazeSprite.addChild(w);
        }

        // Iterate through each cell as it appears (even indices in the inner array),
        // and add surrounding walls for each.
        for (let i = 0; i < this.ny + 1; i++) {
            for (let j = 0; j < this.nx + 1; j++) {
                const pos = this.indexToPosition(i, j);
                // Top-left.
                if (this.array[(2 * i + 0) * this._innerNx + (2 * j + 0)] !== 0)
                    placeCell(pos, -1, -1);

                // Top.
                if (j < this.nx
                    && this.array[(2 * i + 0) * this._innerNx + (2 * j + 1)] !== 0)
                    placeCell(pos, -1, 0);

                // Left.
                if (i < this.ny
                    && this.array[(2 * i + 1) * this._innerNx + (2 * j + 0)] !== 0)
                    placeCell(pos, 0, -1);

                // Self.
                if (i < this.ny && j < this.nx
                    && this.array[(2 * i + 1) * this._innerNx + (2 * j + 1)] !== 0)
                    placeCell(pos, 0, 0);
            }
        }

        return mazeSprite;
    }
}

class RandomPopArray extends Array {
    constructor(n) {
        super(n);
    }

    popRandom() {
        // Take a random value and remove it from the array.
        const idx = Math.floor(Math.random() * this.length);
        const value = this[idx];
        this.splice(idx, 1);

        return value;
    }

    removeFirstElement(value) {
        const idx = this.indexOf(value);
        if (idx >= 0)
            this.splice(idx, 1);
    }
}

// Generate a maze array with modified Wilson's algorithm.
// Wilson's alogirthm is modified here to have some loops intentionally.
function generateMaze(array, ny, nx) {
    // List possible starting points for walls (even indices inside
    // the outer walls).
    const my = (ny - 3) / 2;
    const mx = (nx - 3) / 2;
    const m = my * mx;
    let wallStartPoints = new RandomPopArray(m);
    for (let i = 0; i < my; i++) {
        for (let j = 0; j < mx; j++) {
            wallStartPoints[i * mx + j] = (2 * i + 2) * nx + (2 * j + 2);
        }
    }

    // Place some floating walls. They will be "seeds" of loops.
    // There is a chance that the floating walls cannot be extended
    // from the randomly selected points so we only specify approximate
    // number and length of the floating wals.
    const floatingWallCount = 2;
    const floatingWallLength = 3;
    for (let i = 0; i < floatingWallCount; i++) {
        const startIdx = wallStartPoints.popRandom();
        let idx = startIdx;
        for (let j = 0; j < floatingWallLength; j++) {
            let steps = getStepsForRandomDirections(nx);
            let stepIdx = steps.findIndex(val => array[idx + 2 * val] === 0);
            if (stepIdx >= 0) {
                // Extend the floating wall.
                let step = steps[stepIdx];
                array[idx] = 1;
                array[idx + step] = 1;
                array[idx + 2 * step] = 1;
                wallStartPoints.removeFirstElement(idx + 2 * step);
                
                // Move to the next point.
                idx = idx + 2 * step;
            }
            else {
                // The floating wall could not be extended in any direction.
                // In order not to leave an empty spot, just connect to an
                // surrounding wall and stop.
                const step = steps[0];
                array[idx] = 2;
                array[idx + step] = 2;

                break;
            }
        }
    }

    // The rest of the walls are generated with slightly modified Wilson's algorithm.
    while (wallStartPoints.length > 0) {
        // To prevent making a closed walls, record the walls currently
        // being extended in this iteration
        let current = new Array(0);
        
        const startIdx = wallStartPoints.popRandom();
        let idx = startIdx;
        while (array[idx] === 0) {
            array[idx] = 1;
            current.push(idx);
            wallStartPoints.removeFirstElement(idx);

            // If this point is already surrounded by the same walls
            // currently being extended in this iteration, just give it up.
            let steps = getStepsForRandomDirections(nx);
            const stepIdx = steps.findIndex(val => !current.includes(idx + 2 * val));
            if (stepIdx >= 0) {
                let step = steps[stepIdx];
                array[idx + step] = 1;
                
                // Move to the next point.
                idx += 2 * step;
            }
            else {
                // The current position is being surrounded by the same walls
                // currently being extended in this iteration.
                // If we were to eliminate loops, the wall exntension shall
                // be retried. However, we actually want to make some loops
                // so simply stop the extension here.
                break;
            }
        }
    }
}

function getStepsForRandomDirections(nx) {
    let taken = [false, false, false, false];
    let rs = [-nx, -1, 1, nx];
    for (let i = rs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rs[i], rs[j]] = [rs[j], rs[i]];
    }
    return rs;
}
