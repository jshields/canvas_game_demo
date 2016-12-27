'use strict';

/* Object classes and helper functions */
var rgbColor = function (r, g, b) {
    // color string as accepted by `CanvasRenderingContext2D.fillStyle`
    return 'rgb(' + r + ',' + g + ',' + b + ')';
};
var randColor = function () {
    var r = Math.floor(Math.random() * 256),
        g = Math.floor(Math.random() * 256),
        b = Math.floor(Math.random() * 256);
    return rgbColor(r, g, b);
};

var Coords = function (x, y) {
    this.x = x;
    this.y = y;
    return this;
};
function randCoordsInBounds(canvas, padding) {
    // random canvas coords, padding to prevent partial offscreen rendering
    var randX = (padding + (Math.random() * (canvas.width - (2 * padding))));
    var randY = (padding + (Math.random() * (canvas.height - (2 * padding))));
    return new Coords(randX, randY);
};

function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
};
/*
TODO use classes in Small Game 2.
abstract GameObject = function (...) {
    this.coords = new Coords(x, y);
    this.size = ...;
    this.color = new Color(...);
    this.collisionCheck = ...;
    this.draw = ...;
    return this;
};
*/
var Circle = function (x, y, rad, borderColor, bgColor) {
    this.coords = new Coords(x, y);
    this.radius = rad;
    this.borderColor = borderColor;
    this.bgColor = bgColor;

    // TODO check the shape type of the object checking against,
    // and then call the appropriate collision check
    //this.collisionCheck = ...;

    this.draw = function (canvasContext2D) {
        canvasContext2D.strokeStyle = this.borderColor;
        canvasContext2D.fillStyle = this.bgColor;
        canvasContext2D.beginPath();

        canvasContext2D.arc(
            this.coords.x, this.coords.y, this.radius,
            // 0 degrees to 360 degrees, in radians
            0, 2 * Math.PI
        );

        canvasContext2D.stroke();
        canvasContext2D.fill();
    };
    return this;
};
var Box = function (x, y, w, h, borderColor, bgColor) {
    this.coords = new Coords(x, y);
    this.width = w;
    this.height = h;
    this.borderColor = borderColor;
    this.bgColor = bgColor;

    //this.collisionCheck

    this.draw = function (canvasContext2D) {
        canvasContext2D.strokeStyle = this.borderColor;
        canvasContext2D.fillStyle = this.bgColor;
        canvasContext2D.beginPath();

        canvasContext2D.rect(this.coords.x, this.coords.y, this.width, this.height);

        canvasContext2D.stroke();
        canvasContext2D.fill();
    };
    return this;
};
/*
var Sprite = function () {
    TODO in Small Game 2
    this.draw = function (canvasContext2D) {
        canvasContext2D.drawImage(this.image, this.coords.x, this.coords.y);
    };
    return this;
};
*/
// Common game calculations
var distanceCheck = function (coords1, coords2) {
    // How far are two Coords instances from each other?
    return Math.sqrt(
        Math.pow(coords1.x - coords2.x, 2) +
        Math.pow(coords1.y - coords2.y, 2)
    );
};
var pointCircleCollisionCheck = function (coords, circle) {
    // Is coords point touching circle?
    // Works for e.g. mouse click but not others
    var distance = distanceCheck(coords, circle.coords);
    var radius = circle.radius;
    return (distance <= radius);
};
var circleCircleCollisionCheck = function (circle1, circle2) {
    var ret = false;
    var distance = distanceCheck(circle1.coords, circle2.coords);
    if (distance < circle1.radius + circle2.radius) {
        // Collision detected
        ret = true;
    }
    return ret;
};
var boxBoxCollisionCheck = function (box1, box2) {
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
};
var boxCircleCollisionCheck = function (box, circle) {
    // Find the closest point on the rectangle to the circle.
    // Clamp circle center coordinates to box coordinates.
    var closestX = clamp(circle.coords.x, box.coords.x, box.coords.x + box.width);
    var closestY = clamp(circle.coords.y, box.coords.y, box.coords.y + box.height);

    // Do a collision check between the closest point and circle
    return pointCircleCollisionCheck(new Coords(closestX, closestY), circle)
};
// TODO in a later project: broad phase and narrow phase collision detection

/*
DOM event handling
*/
// Handle click state tracking
var clicked = false;
var mouseX, mouseY;
addEventListener("mousedown", function (e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    clicked = true;
}, false);
addEventListener("mouseup", function (e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    clicked = false;
}, false);

// Handle keyboard state tracking
var keysDown = {};
addEventListener('keydown', function (e) {
    keysDown[e.keyCode] = true;
}, false);
addEventListener('keyup', function (e) {
    delete keysDown[e.keyCode];
}, false);


/* Game objects */
// Create the canvas
// TODO properly scale canvas to device resolution:
// https://www.html5rocks.com/en/tutorials/canvas/hidpi/
// http://stackoverflow.com/a/26154753/3538313
var resolution = new Coords(1024, 768);
var canvas = document.createElement('canvas');
canvas.innerText = 'Your browser does not support the canvas element.';
canvas.width = resolution.x;
canvas.height = resolution.y;
// Opaque 2D context without alpha channel greatly improves text rendering
// http://blogs.adobe.com/webplatform/2014/04/01/new-canvas-features/
var ctx = canvas.getContext('2d', {'alpha': false});

window.onload = function () {
    document.body.appendChild(canvas);
};


/*
TODO in Small Game 2
var readyHtmlElementObjects = function () {
    // DOM ready for game objects that source from Image(), etc.
    // Should probably wait for canvas element to be ready?
};
*/

var player;
var target;
var obstacle;

// TODO
var gameObjects = [player, target, obstacle];
var score = 0;

/*
Game loop
*/
// Pause and unpause
var pause = function () {
    //cancelAnimationFrame?
    running = false;
};
var unpause = function () {
    running = true;
    // Reset `lastTime` to prevent large delta times from being generated
    lastTime = Date.now();
    main();
};
// Reset the game when the player catches runs over a target
var reset = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player = new Circle(
        canvas.width / 2, canvas.height / 2, 32,
        '#000', randColor()
    );
    player.speed = 256;

    target = new Circle(
        null, null, 16,
        '#000', '#0f0'
    );
    target.coords = randCoordsInBounds(canvas, 32);

    obstacle = new Box(null, null, 128, 128, '#000', '#f00');
    obstacle.coords = randCoordsInBounds(canvas, 64);
    
    // TODO later: If objects spawn on top of each other, respawn them
    // if (boxCircleCollisionCheck(obstacle, )) {}

};
// Update game objects
var update = function (delta) {
    // checkPlayerInput();
    if (38 in keysDown) { // Player holding up
        player.coords.y -= player.speed * delta;
    }
    if (40 in keysDown) { // Player holding down
        player.coords.y += player.speed * delta;
    }
    if (37 in keysDown) { // Player holding left
        player.coords.x -= player.speed * delta;
    }
    if (39 in keysDown) { // Player holding right
        player.coords.x += player.speed * delta;
    }
    // TODO prevent double speed from pressing 2 keys at once

    if (circleCircleCollisionCheck(target, player)) {
        ++score;
        reset();
    }
    if (boxCircleCollisionCheck(obstacle, player)) {
        --score;
        reset();
    }

    // TODO: prevent high speed objects from skipping through solids between frames
};
// Draw everything
var render = function () {
    // TODO loop through to call `draw` method on all `gameObjects` with `ctx` passed

    // CSS no longer works for backgroud with alpha off,
    // Assumes opaque black background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    player.draw(ctx);
    target.draw(ctx);
    obstacle.draw(ctx);

    // Score
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    // TODO text needs antialiasing
    var textArgs = ['score: ' + score, 16, 16];
    ctx.fillText.apply(ctx, textArgs);
    //ctx.strokeText.apply(ctx, textArgs);
};
// The main game loop
// TODO in another project: splash screen with instructions
var main = function () {
    if (!running) {
        return;
    }
    /*
    Calculate delta time, converting milliseconds to seconds.
    Speed units are in pixels per second.
    */
    var currentTime = Date.now();
    var deltaTime = (currentTime - lastTime) / 1000;

    update(deltaTime);
    render();

    // Set `lastTime` for the next pass
    lastTime = currentTime;

    // Call `main` again when the next frame is ready.
    requestAnimationFrame(main);
};
// Begin
var running = true;
var lastTime = Date.now();
reset();
main();
