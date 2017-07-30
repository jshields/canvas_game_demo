'use strict';

const DEBUG = true;
const FLOAT_PRECISION = 4;
// Calculations
function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
}

var FLOAT_PRECISION = 4;
function distanceCheck(coords1, coords2) {
    // calculate distance between two Point instances
    return Math.hypot(
        (coords1.x - coords2.x),
        (coords1.y - coords2.y)
    ).toPrecision(FLOAT_PRECISION);
}

// Collision
function pointCircleCollisionCheck(coords, circle) {
    // Is coords point touching circle?
    // Works for e.g. mouse click but not others
    var distance = distanceCheck(coords, circle.coords);
    var radius = circle.radius;
    return (distance <= radius);
}
function circleCircleCollisionCheck(circle1, circle2) {
    var ret = false;
    var distance = distanceCheck(circle1.coords, circle2.coords);
    if (distance < circle1.radius + circle2.radius) {
        // Collision detected
        ret = true;
    }
    return ret;
}
function boxBoxCollisionCheck(box1, box2) {
    var ret = false;
    // Look for gaps between the sides, relative to box1,
    // where the coords of a box is the upper left corner
    if (
        // 1) box1's left line (and to the right) contains right side of box2
        box1.coords.x < box2.coords.x + box2.width &&
        // 2) box1's right line (and to the left) contains left side of box2
        box1.coords.x + box1.width > box2.coords.x &&
        // 3) box1's top line and below contains the bottom side of box2 (remember +Y draws downward)
        box1.coords.y < box2.coords.y + box2.height &&
        // 4) box1's bottom line and above contains top side of box2 (remember +Y draws downward)
        box1.coords.y + box1.height > box2.coords.y
        ) {
        // Collision detected
        ret = true;
    }
    return ret;
}
function boxCircleCollisionCheck(box, circle) {
    // Find the closest point on the rectangle to the circle.
    // Clamp circle center coordinates to box coordinates.
    var closestX = clamp(circle.coords.x, box.coords.x, box.coords.x + box.width);
    var closestY = clamp(circle.coords.y, box.coords.y, box.coords.y + box.height);

    // Do a collision check between the closest point and circle
    return pointCircleCollisionCheck(new Point(closestX, closestY), circle)
}

// Color
function rgbColor(r, g, b) {
    // color string as accepted by `CanvasRenderingContext2D.fillStyle`
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}
function randColor() {
    var r = Math.floor(Math.random() * 256),
        g = Math.floor(Math.random() * 256),
        b = Math.floor(Math.random() * 256);
    return rgbColor(r, g, b);
}

// 2D
var Point = function (x, y) {
    this.x = x;
    this.y = y;
    return this;
};
function randPointInBounds(width, height, padding = 0) {
    // random coords, with optional padding
    var randX = (padding + (Math.random() * (width - (2 * padding))));
    var randY = (padding + (Math.random() * (height - (2 * padding))));
    return new Point(randX, randY);
}
function randPointInCanvasBounds(canvas, padding) {
    // random canvas coords, padding to prevent partial offscreen rendering
    // more or less white noise coords
    return randPointInBounds(canvas.width, canvas.height, padding);
}

function blueNoiseCells(canvas, objects, numCells = objects.length) {
    /*
    blue noise cells to spawn objects pseudo randomly,
    while avoiding overlapped spawns.
    This function currently assumes a square canvas (width === height)
    */
    var cellsPerAxis = parseInt(Math.sqrt(numCells));
    var cellWidth = canvas.width / cellsPerAxis;
    var cellPadding = cellWidth / 4;
    var cellPaddedWidth = cellWidth - cellPadding * 2;

    // store top left corner of each cell
    var cells = [];
    for (var i = 0; i < cellsPerAxis; i++) {
        for (var j = 0; j < cellsPerAxis; j++) {
            cells.push(new Point(i * cellWidth, j * cellWidth));
        }
    }

    if (DEBUG) {
        for (var i = 0; i < objects.length; i++) {
            var sampleObjectWidth = objects[i].width;
            if (sampleObjectWidth > cellPaddedWidth) {
                console.error('Object to spawn larger than padded cell spawn area');
            }
        }
        if (objects.length > numCells) {
            console.error(
                'Too many objects. There can be more cells than objects, ' +
                'but not more objects than cells.'
            );
        }
        if (cells.length !== numCells) {
            console.error(
                'Actual number of cells (' + cells.length + ') ' +
                'not equal to requested (' + numCells + '), ' +
                'choose a number whose square root is a whole number?'
            );
        }
    }

    // randomly map objects to cells they will spawn in
    var cellIndsAvailable = cells.map(function (cell, index) {
        return index;
    });
    var objectsToCellsArr = objects.map(function (obj, index) {
        //debugger;
        var randomCellIndex = cellIndsAvailable[Math.floor(Math.random() * cellIndsAvailable.length)];
        cellIndsAvailable.splice(randomCellIndex, 1);
        return [index, randomCellIndex];
    });
    var objectsToCells = new Map(objectsToCellsArr);

    // for each object, set x and y in bounds of cell with padding
    for (var i = 0; i < objects.length; i++) {
        // NOTE: using width value as height since cells are square
        objects[i].coords = randPointInBounds(cellWidth, cellWidth, cellPadding);
    }

    // debugging grid
    if (DEBUG) {
        for (var i = 0; i < numCells; i++) {
            var cell = cells[i];

            var minX = cell.x;
            //var maxX = minX + cellWidth;
            var minY = cell.y
            //var maxY = minY + cellWidth;

            var paddedMinX = minX + cellPadding;
            var paddedMinY = minY + cellPadding;
            gameObjects.push(new Box(minX, minY, cellWidth, cellWidth, 'rgba(50, 20, 20, 0.8)', 'rgba(50, 0, 0, 0.3)', '', []));
            gameObjects.push(
                new Box(
                    paddedMinX, paddedMinY, cellPaddedWidth, cellPaddedWidth,
                    'rgba(20, 50, 20, 0.8)', 'rgba(0, 50, 0, 0.3)', '', []
                )
            );

        }
    }

}

var collisionShapeOpts = {
    BOX: 0,
    CIRCLE: 1
};
function Collider(collisionShape, collisionTag, collidesWithTags) {

    if (Object.values(collisionShapeOpts).indexOf(collisionShape) === -1) {
        throw new Error('Invalid Collision Shape: ' + collisionShape);
    }

    this.collisionShape = collisionShape;
    // label describing the type of collider this is
    // could be "tree", "wall", "enemy1", or anything
    // IDEA: Allowing multiple tags per object
    this.collisionTag = collisionTag;
    // list of labels that this collider collides with
    this.collidesWithTags = collidesWithTags;

    // IDEA perhaps add this later for collision check optimization
    // boolean to represent if this collider moves
    //this.static = isStatic;

    return this;
}

var GameObject = function (
            x, y, borderColor, bgColor,
            collisionShape, collisionTag, collidesWithTags
        ) {
    this.coords = new Point(x, y);
    this.direction = new Point(0, 0);
    this.speed = 0;
    this.borderColor = borderColor;
    this.bgColor = bgColor;
    this.collider = new Collider(
        collisionShape, collisionTag, collidesWithTags
    );

    return this;
};
var GameObjectPrototype = GameObject.prototype = {
    graphic: function () {
        console.error('Not Implemented');
    },
    draw: function () {
        ctx.strokeStyle = this.borderColor;
        ctx.fillStyle = this.bgColor;
        ctx.beginPath();

        this.graphic();

        ctx.stroke();
        ctx.fill();
    }
};

var Circle = function (x, y, rad, borderColor, bgColor, collisionTag, collidesWithTags) {
    GameObject.call(
        this, x, y, borderColor, bgColor,
        collisionShapeOpts.CIRCLE,
        collisionTag,
        collidesWithTags
    );
    this.radius = rad;
    this.diameter = this.width = this.height = rad * 2;

    return this;
};
Circle.prototype = Object.create(GameObjectPrototype);
Circle.prototype.graphic = function () {
    ctx.arc(
        this.coords.x, this.coords.y, this.radius,
        // 0 degrees to 360 degrees, in radians
        0, 2 * Math.PI
    );
};

var Box = function (x, y, w, h, borderColor, bgColor, collisionTag, collidesWithTags) {
    GameObject.call(
        this, x, y, borderColor, bgColor,
        collisionShapeOpts.BOX,
        collisionTag,
        collidesWithTags
    );
    this.width = w;
    this.height = h;

    return this;
};
Box.prototype = Object.create(GameObjectPrototype);
Box.prototype.graphic = function () {
    ctx.rect(this.coords.x, this.coords.y, this.width, this.height);
};


/*
var Player = function (x, y, rad, borderColor, bgColor, collisionTag, collidesWithTags) {
    Circle.call(this, x, y, rad, borderColor, bgColor, collisionTag, collidesWithTags);
}
var Bullet = function (x, y, rad, borderColor, bgColor, collisionTag, collidesWithTags) {
    this.expiredCheck
    this.handleCollision
}
*/

/* Canvas config */

// TODO properly scale canvas to device resolution:
// https://www.html5rocks.com/en/tutorials/canvas/hidpi/
// http://stackoverflow.com/a/26154753/3538313

var resolution = new Point(640, 640);
var canvas = document.createElement('canvas');
canvas.innerText = 'Your browser does not support the canvas element.';
canvas.width = resolution.x;
canvas.height = resolution.y;
// Opaque 2D context without alpha channel greatly improves text rendering
// http://blogs.adobe.com/webplatform/2014/04/01/new-canvas-features/
var ctx = canvas.getContext('2d', {'alpha': false});
/* End Canvas config */


// keyboard state tracking
// Would a switch case be better?
var keysDown = {};

document.addEventListener('keydown', function (ev) {
    keysDown[ev.code] = true;
});
document.addEventListener('keyup', function (ev) {
    delete keysDown[ev.code];
});
window.addEventListener('load', function (ev) {
    document.body.appendChild(canvas);
});
window.addEventListener('focus', function() {
    unpause();
});
window.addEventListener('blur', function() {
    pause();
});


// Global vars
var gameObjects = [];
var player;
var target;
var obstacle;

var running;
var lastTime;
var score = 0;
var time = 999;  // = 20;

var handlePlayerInput = function (delta) {
    player.direction.x = 0;
    player.direction.y = 0;

    // Movement
    if (('ArrowUp' in keysDown) || ('KeyW' in keysDown)) {
        player.direction.y = -1;
    }
    if (('ArrowDown' in keysDown) || ('KeyS' in keysDown)) {
        player.direction.y = 1;
    }
    if (('ArrowLeft' in keysDown) || ('KeyA' in keysDown)) {
        player.direction.x = -1;
    }
    if (('ArrowRight' in keysDown) || ('KeyD' in keysDown)) {
        player.direction.x = 1;
    }

    // Shoot
    if (('Space' in keysDown) && (player.shotReady === true)) {

        var bullet = new Circle(
            player.coords.x, player.coords.y, 8,
            '#000', '#000',
            'bullet', ['target', 'obstacle']
        );
        // Right now, the bullet is defined each time the player shoots
        // TODO make Bullet constructor
        bullet.speed = 1024;
        bullet.direction = new Point(player.facing.x, player.facing.y);
        bullet.expiredCheck = function () {
            if (
                (this.coords.x > (canvas.width + this.radius)) ||
                (this.coords.x < -this.radius) ||
                (this.coords.y > (canvas.height + this.radius)) ||
                (this.coords.y < -this.radius)
            ) {
                return true;
            }
            return false;
        };
        bullet.handleCollision = function (other) {
            switch (other.collider.collisionTag) {
                case 'target':
                    console.log('bullet collided with target');
                    --score;
                    // destroy bullet after it collides
                    // perhaps this is a bit of a hack
                    this.expiredCheck = function () {return true;};
                    spawnObjectsDefault();
                    //respawnObjects();
                    break;
                case 'obstacle':
                    console.log('bullet collided with obstacle')
                    ++score;
                    this.expiredCheck = function () {return true;};
                    spawnObjectsDefault();
                    //respawnObjects();
                    break;
                default:
                    console.warn('No collision logic for tagged collision');
            }
        };

        // place the bullet into the game
        gameObjects.push(bullet);

        // limit player firing rate
        player.shotReady = false;
        setTimeout(function () {
            player.shotReady = true;
        }, 250);
    }
};

var updateGameObjects = function (delta) {
    var i = gameObjects.length;
    while (i--) {
        var obj = gameObjects[i];
        // Movement
        if (obj.direction.x === 0 || obj.direction.y === 0) {
            obj.coords.x += (obj.speed * obj.direction.x * delta);
            obj.coords.y += (obj.speed * obj.direction.y * delta);
        } else {
            // x and y both active (diagonal movement),
            // the movement hypotenuse is longer and it would give "extra speed"
            // a^2 + b^2 = c^2
            // sqrt(x^2 + y^2) = sqrt(2)
            // Scaling the vector by (1 / c) normalizes the vector
            // IDEA implement a Vector2d class for real?
            obj.coords.x += ((obj.speed * (1 / Math.SQRT2)) * obj.direction.x * delta);
            obj.coords.y += ((obj.speed * (1 / Math.SQRT2)) * obj.direction.y * delta);
        }
        // Expiry (remove object from game)
        if (typeof obj.expiredCheck !== 'undefined') {
            if (obj.expiredCheck() === true) {
                // remove expired objects
                gameObjects.splice(i, 1);
            }
        }
    }
};

var handleCollisions = function () {
    // IDEA broad phase and narrow phase collision detection

    var len = gameObjects.length;
    var obj, other, i, j;
    for (i = 0; i < len; i++) {
        obj = gameObjects[i];

        for (j = 0; j < len; j++) {
            other = gameObjects[j];

            if (other == null) {
                console.error('Expected other object');
            }

            if (obj === other) {
                // cannot collide with self
                continue;
            }

            // if the other object's collision tag is in the object's "collides with" tags
            if (obj.collider.collidesWithTags.indexOf(other.collider.collisionTag) !== -1) {
                // obj can collide with other
                var objShapeType = obj.collider.collisionShape,
                    otherShapeType = other.collider.collisionShape;
                // TODO Find a better way to map shapes to their collision functions
                // the box VS circle args need to be in the right order
                var colliding;
                if (objShapeType === collisionShapeOpts.BOX) {
                    if (otherShapeType === collisionShapeOpts.BOX) {
                        // box box
                        colliding = boxBoxCollisionCheck(obj, other);
                    } else if (otherShapeType === collisionShapeOpts.CIRCLE) {
                        // box circle
                        colliding = boxCircleCollisionCheck(obj, other);
                    }
                } else if (objShapeType === collisionShapeOpts.CIRCLE) {
                    if (otherShapeType === collisionShapeOpts.BOX) {
                        // circle box
                        // args are reversed here since target is the box
                        colliding = boxCircleCollisionCheck(other, obj);
                    } else if (otherShapeType === collisionShapeOpts.CIRCLE) {
                        // circle circle
                        colliding = circleCircleCollisionCheck(obj, other);
                    }
                }
                if (colliding) {
                    if (typeof obj.handleCollision !== 'undefined') {
                        obj.handleCollision(other);
                    }
                }
            }

        }  // end nested for
    }  // end for

};

var drawGameObjects = function () {
    var i = gameObjects.length;
    while (i--) {
        var obj = gameObjects[i];
        if (typeof obj.draw !== 'undefined') {
            obj.draw();
        }
    }
};
var drawUi = function () {
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillText('score: ' + score, 16, 16);
    ctx.fillText('time: ' + parseInt(time), canvas.width - 96, 16);

    // TODO center the text. They draw from their upleft corner, but that corner is in middle of canvas
    if (!running) {
        ctx.fillText('Paused', canvas.width/2, canvas.height/2);
    }
    if (time <= 0) {
        ctx.fillText('Out of time!', canvas.width/2, canvas.height/2);
        ctx.fillText('Final score: ' + score, canvas.width/2, canvas.height/2 + 18);
    }

};

/*
Game loop
*/
// Pause and unpause
var pause = function () {
    //cancelAnimationFrame?
    running = false;
    keysDown = {};
    console.log('paused');
};
var unpause = function () {
    running = true;
    // Reset `lastTime` to prevent large delta times from being generated
    lastTime = Date.now();
    console.log('unpaused');
    main();
};

var spawnObjects = function (objs, numCells) {
    // wrapper method

    /*
    target.coords = randPointInCanvasBounds(canvas, 32);
    obstacle.coords = randPointInCanvasBounds(canvas, 128);
    */
    blueNoiseCells(canvas, objs, numCells);

    gameObjects = gameObjects.concat(objs);

    if (DEBUG) {
        blueNoiseCells(canvas, [
            //new Box()
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
        ]);

        if (boxCircleCollisionCheck(obstacle, target) ||
                boxCircleCollisionCheck(obstacle, player) ||
                circleCircleCollisionCheck(target, player)) {
            console.error('bad spawn location');
        }
    }
};

// Reset the game when the player catches runs over a target
var reset = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /*
    Player setup

    The player is a circle object right now
    TODO make Player constructor
    */
    player = new Circle(
        canvas.width / 2, canvas.height / 2, 32,
        '#000', randColor(),
        'player', ['target', 'obstacle']
    );
    player.speed = 256;
    // movement direction - affects position
    player.direction = new Point(0, 0);
    // facing direction - should remain after keys released
    player.facing = new Point(1, 0);
    //player.strafing = false;
    player.shotReady = true;

    player.graphic = function () {
        Circle.prototype.graphic.call(this);

        // draw direction facing line
        //ctx.beginPath();
        var pointer = new Point();

        // TODO changing `facing` should be in update, not draw
        if (!(this.direction.x === 0 && this.direction.y === 0)) { //&& !this.strafing
            // player can't face "down" on the 2D plane,
            // so they must have some positive direction for facing to be updated
            this.facing.x = this.direction.x;
            this.facing.y = this.direction.y;
        }


        if (this.facing.x === 0 || this.facing.y === 0) {
            // just y or just x
            pointer.x = this.facing.x * (this.radius + 5);
            pointer.y = this.facing.y * (this.radius + 5);
        } else {
            // x and y component are both active
            pointer.x = (this.facing.x * (this.radius + 5)) * (1 / Math.SQRT2);
            pointer.y = (this.facing.y * (this.radius + 5)) * (1 / Math.SQRT2);
        }

        ctx.moveTo(this.coords.x, this.coords.y);
        ctx.lineTo(
            this.coords.x + pointer.x,
            this.coords.y + pointer.y
        );
    };  // end player graphic

    player.handleCollision = function (other) {
        switch (other.collider.collisionTag) {
            case 'target':
                console.log('player collided with target');
                ++score;
                spawnObjectsDefault();
                //respawnObjects();
                break;
            case 'obstacle':
                console.log('player collided with obstacle')
                --score;
                spawnObjectsDefault();
                //respawnObjects();
                break;
            default:
                console.warn('No collision logic for tagged collision');
        }
    };

    /* Target setup */
    target = new Circle(
        null, null, 16,
        '#000', '#0f0',
        'target', []
    );

    /* Obstacle setup */
    obstacle = new Box(
        null, null, 96, 96, '#000', '#f00',
        'obstacle', []
    );


    // TODO is there a way to make sure objects don't respawn on player cell?
    // keep track of player cell and remove it from possible spawn cells?
    var spawnObjectsDefault = spawnObjects.bind([target, obstacle], 9);
    spawnObjectsDefault();

    // set the initial object positions and push them into the game space
    //respawnObjects();

    gameObjects = gameObjects.concat([player, target, obstacle]);
};

var respawnObjects = function () {
    target.coords = randPointInBounds(canvas, 32);
    obstacle.coords = randPointInBounds(canvas, 128);
    // If objects spawn on top of each other, respawn them
    // IDEA spawn using blue noise cells instead to solve this problem
    if (boxCircleCollisionCheck(obstacle, target) ||
        boxCircleCollisionCheck(obstacle, player) ||
        circleCircleCollisionCheck(target, player)
        ) {
        console.warn('bad respawn location, retrying');
        respawnObjects();
    }
};

var update = function () {
    // Update game objects
    /*
    Calculate delta time, converting milliseconds to seconds.
    Speed units are in pixels per second.
    */
    var currentTime = Date.now();
    var deltaTime = (currentTime - lastTime) / 1000;
    time -= deltaTime;

    handlePlayerInput(deltaTime);
    updateGameObjects(deltaTime);
    handleCollisions();

    // Set `lastTime` for the next pass
    lastTime = currentTime;

    /*
    IDEA: prevent high speed objects from skipping through solids between frames,
    not currently needed
    */
};
// Draw everything
var render = function () {
    // CSS no longer works for backgroud with alpha off,
    // assumes opaque black background, so draw the background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGameObjects();

    drawUi();
};
// The main game loop
var main = function () {

    if ((!running) || (time <= 0)) {
        render();
        return;
    }

    // main game loop's update / draw phases
    update();
    render();

    // Call `main` again when the next frame is ready.
    requestAnimationFrame(main);
};

// Begin
running = true;
lastTime = Date.now();
reset();
main();
