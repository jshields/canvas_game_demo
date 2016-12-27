'use strict';

/* Object classes and helper functions */
var Color = function (r, g, b) {
    return 'rgb(' + r + ',' + g + ',' + b + ')';
};
var Coords = function (x, y) {
    this.x = x;
    this.y = y;
    return this;
};
function clamp(val, min, max) {
    return val < min ? min : val > max ? max : val;
};
/*
TODO use classes in Simple Game 2.
abstract GameObject = function (...) {
    this.coords = new Coords(x, y);
    this.size = ...;
    this.color = new Color(...);
    this.collisionCheck = ...;
    this.draw = ...;
    return this;
};
*/
var Circle = function (x, y, rad, color) {
    this.coords = new Coords(x, y);
    this.radius = rad;
    this.color = color;

    this.collisionCheck = function (obj) {
        return circleCollisionCheck(obj, this)
    };

    this.draw = function (canvasContext2D) {
        // Set the current color to draw with
        canvasContext2D.fillStyle = this.color;
        // Draw this
        canvasContext2D.beginPath();
        canvasContext2D.arc(
            this.coords.x, this.coords.y, this.radius,
            // 0 degrees to 360 degrees, in radians
            0, 2 * Math.PI
        );
        canvasContext2D.fill();
    };
    return this;
};
var Box = function (x, y, w, h, color) {
    this.coords = new Coords(x, y);
    this.width = w;
    this.height = h;
    this.color = color;

    //this.collisionCheck

    this.draw = function (canvasContext2D) {
        // Set the current color to draw with
        canvasContext2D.fillStyle = this.color;
        // Draw this
        canvasContext2D.fillRect(this.coords.x, this.coords.y, this.w, this.h); 
    };
    return this;
};
/*
var Sprite = function () {
    TODO in Simple Game 2
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
        console.log('circle circle collision');
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
    /*
    // Distance from centers
    var distX = Math.abs(circle.coords.x - (box.coords.x + box.w / 2));
    var distY = Math.abs(circle.coords.y - (box.coords.y + box.h / 2));

    // Too far apart to be colliding?
    if (
        // If too far away horizontally...
        (distX > (box.w / 2 + circle.r)) ||
        // or too far away vertically
        (distY > (box.h / 2 + circle.r))
        ) {
        // then not colliding.
        return false;
    }
    // Close enough to be colliding?
    if (
        // Right / Left check
        (distX <= (box.w / 2)) ||
        // Top / Bottom check
        (distY <= (box.h / 2))
        ) {
        return true;
    }
    // On the corner?
    //          x2    - x1
    var dx = distX - (box.w / 2);
    //          y2    - y1
    var dy = distY - (box.h / 2);
    // a^2 + b^2 = c^2
    return (dx * dx + dy * dy <= (circle.r * circle.r));
    */
    /*
    // From (0, 0) relative frame of reference, each point forms a hypotenuse.
    // boxCircleDistHypot: From box to circle
    // cornerHypot: Box corner
    // Is the box corner in range of the circle?
    var boxCircleDistHypot = new Coords(distX, distY);
    var cornerHypot = new Coords(box.width / 2, box.height / 2);
    var foo = distanceCheck(cornerHypot, boxCircleDistHypot);
    return foo <= circle.radius;
    */

    // Find the closest point on the rectangle to the circle.
    // Clamp circle center coordinates to box coordinates.
    /*
    If circle's X is min compared to right side of box,
    and max compared to left side,
    we're somewhere inside the box,
    and distX resolves to 0.
    */
    //                     left              inside    right
    //var dX = circle.x - Max(box.coords.x, Min(circle.x, box.coords.x + box.width));
    //                     top               inside    bottom
    //var dY = circle.y - Max(box.coords.y, Min(circle.y, box.coords.y + box.height));
    //return (DeltaX * DeltaX + DeltaY * DeltaY) < (CircleRadius * CircleRadius);

    var closestX = clamp(circle.x, box.coords.x, box.coords.x + box.width);
    var closestY = clamp(circle.y, box.coords.y, box.coords.y + box.height);

    // Do a point check between the closest point on the rectangle from the circle's center
    return pointCircleCollisionCheck(new Coords(closestX, closestY), circle)
};

// TODO in a later project: broad phase and narrow phase collision detection

/* Game objects */
// Create the canvas
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
// canvas.visibility = "visible";
document.body.appendChild(canvas);

/*
TODO in Simple Game 2
var readyHtmlElementObjects = function () {
    // DOM ready for game objects that source from Image(), etc.
    // Should probably wait for canvas element to be ready?
};
*/

var player = new Circle();

var target = new Circle();

var obstacle = new Box();

// TODO
var gameObjects = [player, target, obstacle];
var score = 0;

/*
DOM event handling
*/
// Handle click state tracking
var clicked = false;
var mouseX, mouseY;
addEventListener("touchstart", function (e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    clicked = true;
}, false);

var mouseX, mouseY;
addEventListener("touchend", function (e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    clicked = false;
}, false);

var mouseX, mouseY;
addEventListener("mousedown", function (e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
    clicked = true;
}, false);

var mouseX, mouseY;
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
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    // Throw a new target somewhere on the screen randomly
    target.x = 32 + (Math.random() * (canvas.width - 64));
    target.y = 32 + (Math.random() * (canvas.height - 64));
};
// Update game objects
var update = function (delta) {
    // checkPlayerInput();
    if (38 in keysDown) { // Player holding up
        //player.y -= player.speed * delta;
    }
    if (40 in keysDown) { // Player holding down
        //player.y += player.speed * delta;
    }
    if (37 in keysDown) { // Player holding left
        //player.x -= player.speed * delta;
    }
    if (39 in keysDown) { // Player holding right
        //player.x += player.speed * delta;
    }
    // Player touching target? TODO refactor
    /*
    if (
        player.x <= (target.x + 32)
        && target.x <= (player.x + 32)
        && player.y <= (target.y + 32)
        && target.y <= (player.y + 32)
    ) {
        ++score;
        reset();
    }
    */


    // TODO: prevent high speed objects from skipping through solids between frames
};
// Draw everything
var render = function () {

    // TODO call `draw` method on all `gameObjects`

    // Score
    // TODO is it possible to use CSS for this?
    ctx.font = "18px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("score (targets hit - obstacles hit): " + score, 373, 8);
};
// The main game loop
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
    // Not bothering with cross-browser support.
    requestAnimationFrame(main);
};
// Begin
var running = true;
var lastTime = Date.now();
reset();
main();
