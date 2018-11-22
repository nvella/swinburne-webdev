"use strict";
var Vect = /** @class */ (function () {
    function Vect(x, y) {
        var _this = this;
        this.add = function (v) { return new Vect(_this.x + v.x, _this.y + v.y); };
        this.sub = function (v) { return new Vect(_this.x - v.x, _this.y - v.y); };
        this.mul = function (v) { return (v instanceof Vect) ? new Vect(_this.x * v.x, _this.y * v.y) : new Vect(_this.x * v, _this.y * v); };
        this.div = function (v) { return (v instanceof Vect) ? new Vect(_this.x * v.x, _this.y * v.y) : new Vect(_this.x / v, _this.y / v); };
        this.x = x;
        this.y = y;
    }
    return Vect;
}());
var KEY_W = 87;
var KEY_A = 65;
var KEY_S = 83;
var KEY_D = 68;
var MOVEMENT = .5;
var RENDER_DISTANCE = 256;
var mod = function (x, n) { return (x % n + n) % n; };
var getLineIntersection = function (p0, p1, p2, p3) {
    var s1x, s1y, s2x, s2y;
    s1x = p1.x - p0.x;
    s1y = p1.y - p0.y;
    s2x = p3.x - p2.x;
    s2y = p3.y - p2.y;
    var s, t;
    s = (-s1y * (p0.x - p2.x) + s1x * (p0.y - p2.y)) / (-s2x * s1y + s1x * s2y);
    t = (s2x * (p0.y - p2.y) - s2y * (p0.x - p2.x)) / (-s2x * s1y + s1x * s2y);
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected
        return new Vect(p0.x + (t * s1x), p0.y + (t * s1y));
    }
    return null; // No collision
};
var Raycast = /** @class */ (function () {
    function Raycast(canvas, info) {
        this.entities = [
            { pos: new Vect(1, 1), color: '#f00' }
            //{pos: new Vect(2, 1), color: '#0f0'},
            //{pos: new Vect(3, 1), color: '#00f'},
            //{pos: new Vect(1, 2), color: '#ff0'},
            //{pos: new Vect(1, 3), color: '#0ff'}
        ];
        this.pos = new Vect(0.0, 0.0);
        this.angle = 0.0; // 0 to 360
        this.pov = 80;
        this.keys = {};
        this.canvas = canvas;
        this.info = info;
        this.ctx = canvas.getContext('2d');
    }
    Raycast.prototype.draw = function () {
        for (var x = 0; x < this.canvas.width; x++) {
            this.ctx.strokeStyle = "#000";
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
            // Send ray
            var relAngle = (this.angle - this.pov / 2) + ((this.pov / this.canvas.width) * x);
            var ray = this.sendRay(this.pos, relAngle);
            if (ray) {
                var height = this.canvas.height / ray.distance;
                this.ctx.strokeStyle = ray.entity.color;
                this.ctx.beginPath();
                this.ctx.moveTo(x, (this.canvas.height / 2) - (height / 2));
                this.ctx.lineTo(x, (this.canvas.height / 2) + (height / 2));
                this.ctx.stroke();
            }
        }
        this.info.innerHTML = "x: " + this.pos.x + " y: " + this.pos.y + " a: " + this.angle;
    };
    // Returns a Ray if the ray hit something
    Raycast.prototype.sendRay = function (vect, angle) {
        var dists = [];
        for (var _i = 0, _a = this.entities; _i < _a.length; _i++) {
            var entity = _a[_i];
            var walls = [
                // p3x              p3y                                   p4x             p4y
                [new Vect(entity.pos.x, entity.pos.y), new Vect(entity.pos.x + 1, entity.pos.y)],
                [new Vect(entity.pos.x + 1, entity.pos.y), new Vect(entity.pos.x + 1, entity.pos.y + 1)],
                [new Vect(entity.pos.x, entity.pos.y), new Vect(entity.pos.x, entity.pos.y + 1)],
                [new Vect(entity.pos.x, entity.pos.y + 1), new Vect(entity.pos.x + 1, entity.pos.y + 1)],
            ];
            var i = 0;
            var temp = ['#f00', '#0f0', '#00f', '#ff0'];
            for (var _b = 0, walls_1 = walls; _b < walls_1.length; _b++) {
                var wall = walls_1[_b];
                var p0 = vect;
                var p1 = new Vect(Math.sin((Math.PI / 180) * angle) * RENDER_DISTANCE, -Math.cos((Math.PI / 180) * angle) * RENDER_DISTANCE);
                var p2 = wall[0];
                var p3 = wall[1];
                var hit = getLineIntersection(p0, p1, p2, p3);
                if (hit)
                    dists.push({
                        src: vect,
                        angle: angle,
                        dst: hit,
                        entity: {
                            pos: entity.pos,
                            color: temp[i]
                        },
                        distance: Math.sqrt(Math.pow((hit.x - vect.x), 2) + Math.pow((hit.y - vect.y), 2))
                    });
                i++;
            }
        }
        if (dists.length < 1)
            return null;
        return dists.sort(function (o) { return o.distance; })[0] || null;
    };
    Raycast.prototype.update = function () {
        // Handle input
        if (this.keys[KEY_A])
            this.angle = mod(this.angle - 2, 360);
        if (this.keys[KEY_D])
            this.angle = mod(this.angle + 2, 360);
        if (this.keys[KEY_W]) {
            this.pos.x += Math.sin((Math.PI / 180) * this.angle) * MOVEMENT;
            this.pos.y += -Math.cos((Math.PI / 180) * this.angle) * MOVEMENT;
        }
        if (this.keys[KEY_S]) {
            this.pos.x -= Math.sin((Math.PI / 180) * this.angle) * MOVEMENT;
            this.pos.y -= -Math.cos((Math.PI / 180) * this.angle) * MOVEMENT;
        }
        // Draw
        this.draw();
    };
    Raycast.prototype.start = function () {
        var _this = this;
        // Set draw interval
        setInterval(function () { return _this.update(); }, 1000 / 60);
        // Set input handlers
        window.onkeyup = function (e) { _this.keys[e.keyCode] = false; };
        window.onkeydown = function (e) { _this.keys[e.keyCode] = true; };
    };
    return Raycast;
}());
