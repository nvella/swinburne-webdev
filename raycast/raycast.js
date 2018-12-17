"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var Colour = /** @class */ (function () {
    function Colour(r, g, b) {
        var _this = this;
        this.mul = function (mul) { return new Colour(_this.r * mul, _this.g * mul, _this.b * mul); };
        this.rep = function () { return "rgba(" + _this.r + ", " + _this.g + ", " + _this.b + ", 1.0)"; };
        this.r = r;
        this.g = g;
        this.b = b;
    }
    return Colour;
}());
var HitActionType;
(function (HitActionType) {
    HitActionType[HitActionType["Render"] = 0] = "Render";
    HitActionType[HitActionType["Rewrite"] = 1] = "Rewrite";
})(HitActionType || (HitActionType = {}));
var ColourMaterial = /** @class */ (function (_super) {
    __extends(ColourMaterial, _super);
    function ColourMaterial() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.getStripe = function () { return [_this]; };
        return _this;
    }
    return ColourMaterial;
}(Colour));
var XTestMaterial = /** @class */ (function () {
    function XTestMaterial() {
        this.getStripe = function (r) { return r ? [new Colour(Math.abs(255 - r.distance * 8), 255, Math.abs(r.distance * 8))] : [new Colour(255, 0, 0)]; };
    }
    return XTestMaterial;
}());
var Plane = /** @class */ (function () {
    function Plane(v0, v1, mat) {
        var _this = this;
        // TODO Override this in all subclasses returning new class
        this.addVect = function (v) { return new Plane(_this.v0.add(v), _this.v1.add(v), _this.mat); };
        this.v0 = v0;
        this.v1 = v1;
        this.mat = mat || new XTestMaterial();
    }
    Object.defineProperty(Plane.prototype, "length", {
        get: function () {
            return Math.sqrt(Math.pow(Math.abs(this.v1.x - this.v0.x), 2) + Math.pow(Math.abs(this.v1.y - this.v0.y), 2));
        },
        enumerable: true,
        configurable: true
    });
    ;
    Object.defineProperty(Plane.prototype, "material", {
        get: function () {
            return this.mat;
        },
        enumerable: true,
        configurable: true
    });
    Plane.prototype.doHit = function (r) {
        return {
            type: HitActionType.Render
        };
    };
    return Plane;
}());
var MeshBase = /** @class */ (function () {
    function MeshBase() {
        var _this = this;
        this.planes = [];
        this.origin = new Vect(0, 0);
        this.absPlanes = function () { return _this.planes.map(function (p) { return p.addVect(_this.origin); }); };
    }
    return MeshBase;
}());
var MeshPlanar = /** @class */ (function (_super) {
    __extends(MeshPlanar, _super);
    function MeshPlanar(origin, planes) {
        var _this = _super.call(this) || this;
        _this.origin = origin;
        _this.planes = planes;
        return _this;
    }
    return MeshPlanar;
}(MeshBase));
var MeshCube = /** @class */ (function (_super) {
    __extends(MeshCube, _super);
    function MeshCube(origin, w, l) {
        var _this = _super.call(this) || this;
        _this.setGeometry = function (w, l) { return _this.planes = [
            new Plane(new Vect(0, 0), new Vect(w, 0)),
            new Plane(new Vect(0, 0), new Vect(0, l)),
            new Plane(new Vect(w, 0), new Vect(w, l)),
            new Plane(new Vect(0, l), new Vect(w, l)),
        ]; };
        _this.origin = origin;
        _this.setGeometry(w, l);
        return _this;
    }
    return MeshCube;
}(MeshBase));
var MeshTriangle = /** @class */ (function (_super) {
    __extends(MeshTriangle, _super);
    function MeshTriangle(origin, w, l) {
        var _this = _super.call(this) || this;
        _this.setGeometry = function (w, l) { return _this.planes = [
            new Plane(new Vect(0, 0), new Vect(w, 0)),
            new Plane(new Vect(0, 0), new Vect(w / 2, l)),
            new Plane(new Vect(w, 0), new Vect(w / 2, l))
        ]; };
        _this.origin = origin;
        _this.setGeometry(w, l);
        return _this;
    }
    return MeshTriangle;
}(MeshBase));
var PortalPlane = /** @class */ (function (_super) {
    __extends(PortalPlane, _super);
    function PortalPlane(rc, v0, v1, x0, x1) {
        var _this = _super.call(this, v0, v1) || this;
        // TODO Override this in all subclasses returning new class
        _this.addVect = function (v) { return new PortalPlane(_this.rc, _this.v0.add(v), _this.v1.add(v), _this.x0, _this.x1); };
        _this.rc = rc;
        _this.x0 = x0;
        _this.x1 = x1;
        return _this;
    }
    Object.defineProperty(PortalPlane.prototype, "opLength", {
        get: function () { return Math.sqrt(Math.pow(Math.abs(this.x1.x - this.x0.x), 2) + Math.pow(Math.abs(this.x1.y - this.x0.y), 2)); },
        enumerable: true,
        configurable: true
    });
    PortalPlane.prototype.doHit = function (r) {
        var _a = this.translate(r.px, r.angle), src = _a[0], angle = _a[1];
        return {
            type: HitActionType.Rewrite,
            rewrite: { src: src, angle: angle }
        };
    };
    /** Given a plane X and angle, calculate an output vector and angle */
    PortalPlane.prototype.translate = function (px, angle) {
        // Calculate output vector and translate angle from input px and angle
        // Calculate portal plane angle
        var ppa = Math.atan2(this.v1.y - this.v0.y, this.v1.x - this.v0.x);
        // Calculate output plane angle
        var opa = Math.atan2(this.x1.y - this.x0.y, this.x1.x - this.x0.x);
        // Delta angle in degs
        var delta = (ppa - opa) * (180 / Math.PI);
        // calculate output plane x
        var opx = (px / this.length) * this.opLength;
        // Translate output hit vector
        var ov = new Vect(this.x0.x + Math.sin(opa + (90 * Math.PI / 180)) * opx, this.x0.y - Math.cos(opa + (90 * Math.PI / 180)) * opx);
        return [ov, angle + delta];
    };
    return PortalPlane;
}(Plane));
var KEY_W = 87;
var KEY_A = 65;
var KEY_S = 83;
var KEY_D = 68;
var MOVEMENT = .1;
var RENDER_DISTANCE = 128;
var MAX_RECURSION = 8;
var MAP_SCALE = 32;
var MAP_BLIP = 1;
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
    function Raycast(canvas, info, map) {
        this.meshes = [
            new MeshCube(new Vect(2, 2), 1, 1)
        ];
        this.pos = new Vect(5.0, 3.0);
        this.angle = 0; // 0 to 360
        this.fov = 60;
        this.keys = {};
        this.i = 0;
        this.canvas = canvas;
        this.info = info;
        this.ctx = canvas.getContext('2d');
        this.map = map;
        this.mapCtx = map.getContext('2d');
    }
    Raycast.prototype.drawMapBlip = function (v) {
        this.mapCtx.beginPath();
        this.mapCtx.arc(v.x * MAP_SCALE, v.y * MAP_SCALE, MAP_BLIP, 0, 2 * Math.PI);
        this.mapCtx.stroke();
    };
    Raycast.prototype.drawMapLine = function (l1, l2) {
        this.mapCtx.beginPath();
        this.mapCtx.moveTo(l1.x * MAP_SCALE, l1.y * MAP_SCALE);
        this.mapCtx.lineTo(l2.x * MAP_SCALE, l2.y * MAP_SCALE);
        this.mapCtx.stroke();
    };
    Raycast.prototype.drawMap = function () {
        // do a backflip
        this.mapCtx.clearRect(0, 0, this.map.width, this.map.height);
        for (var _i = 0, _a = this.meshes; _i < _a.length; _i++) {
            var mesh = _a[_i];
            for (var _b = 0, _c = mesh.absPlanes(); _b < _c.length; _b++) {
                var plane = _c[_b];
                this.mapCtx.beginPath();
                this.mapCtx.strokeStyle = plane.mat.getStripe()[0].rep();
                this.mapCtx.moveTo(plane.v0.x * MAP_SCALE, plane.v0.y * MAP_SCALE);
                this.mapCtx.lineTo(plane.v1.x * MAP_SCALE, plane.v1.y * MAP_SCALE);
                this.mapCtx.stroke();
                this.mapCtx.closePath();
                if (plane instanceof PortalPlane) {
                    this.mapCtx.beginPath();
                    this.mapCtx.strokeStyle = "#f0f";
                    this.mapCtx.moveTo(plane.x0.x * MAP_SCALE, plane.x0.y * MAP_SCALE);
                    this.mapCtx.lineTo(plane.x1.x * MAP_SCALE, plane.x1.y * MAP_SCALE);
                    this.mapCtx.stroke();
                    this.mapCtx.closePath();
                }
            }
            // this.mapCtx.fillRect(entity.pos.x * MAP_SCALE, entity.pos.y * MAP_SCALE, MAP_SCALE, MAP_SCALE);
        }
        this.mapCtx.fillStyle = 'black';
        this.drawMapBlip(this.pos);
        this.mapCtx.beginPath();
        this.mapCtx.moveTo(this.pos.x * MAP_SCALE, this.pos.y * MAP_SCALE);
        this.mapCtx.lineTo((this.pos.x + Math.sin((Math.PI / 180) * (this.angle - this.fov / 2))) * MAP_SCALE, (this.pos.y - Math.cos((Math.PI / 180) * (this.angle - this.fov / 2))) * MAP_SCALE);
        this.mapCtx.stroke();
        this.mapCtx.moveTo(this.pos.x * MAP_SCALE, this.pos.y * MAP_SCALE);
        this.mapCtx.lineTo((this.pos.x + Math.sin((Math.PI / 180) * (this.angle + this.fov / 2))) * MAP_SCALE, (this.pos.y - Math.cos((Math.PI / 180) * (this.angle + this.fov / 2))) * MAP_SCALE);
        this.mapCtx.stroke();
        this.mapCtx.moveTo(this.pos.x * MAP_SCALE, this.pos.y * MAP_SCALE);
        this.mapCtx.lineTo((this.pos.x + Math.sin((Math.PI / 180) * this.angle)) * MAP_SCALE, (this.pos.y - Math.cos((Math.PI / 180) * this.angle)) * MAP_SCALE);
        this.mapCtx.stroke();
    };
    Raycast.prototype.draw = function () {
        this.drawMap();
        for (var x = 0; x < this.canvas.width; x++) {
            this.ctx.strokeStyle = "#000";
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
            // Send ray
            var hIndex = (x / (this.canvas.width - 1)) * 2 - 1;
            var relAngle = ((this.fov / this.canvas.width) * x) - this.fov / 2;
            var absAngle = this.angle + relAngle;
            var ray = this.sendRay(this.pos, absAngle, 0, 0, false, true);
            if (ray) {
                var height = this.canvas.height / (ray.distance * Math.cos(relAngle * (Math.PI / 180)));
                var stripe = ray.plane.mat.getStripe(ray);
                this.ctx.strokeStyle = (stripe[0].mul(ray.i < 2 ? 1 : 0.8)).rep();
                this.ctx.beginPath();
                this.ctx.moveTo(x, (this.canvas.height / 2) - (height / 2));
                this.ctx.lineTo(x, (this.canvas.height / 2) + (height / 2));
                this.ctx.stroke();
            }
            this.ctx.closePath();
        }
        this.info.innerHTML = "x: " + this.pos.x + " y: " + this.pos.y + " a: " + this.angle;
    };
    // Returns a Ray if the ray hit something
    Raycast.prototype.sendRay = function (vect, angle, distance, levels, returnHitAlways, drawDebug) {
        if (distance === void 0) { distance = 0; }
        if (levels === void 0) { levels = 0; }
        if (returnHitAlways === void 0) { returnHitAlways = false; }
        if (drawDebug === void 0) { drawDebug = true; }
        var hits = [];
        for (var _i = 0, _a = this.meshes; _i < _a.length; _i++) {
            var mesh = _a[_i];
            var i = 0;
            for (var _b = 0, _c = mesh.absPlanes(); _b < _c.length; _b++) {
                var plane = _c[_b];
                var checkEnd = new Vect(Math.sin((Math.PI / 180) * angle) * RENDER_DISTANCE, -Math.cos((Math.PI / 180) * angle) * RENDER_DISTANCE);
                var hit = getLineIntersection(vect, checkEnd, plane.v0, plane.v1);
                if (hit) {
                    // Calculate the hit position relative to the plane's surface 
                    var px = Math.abs(Math.sqrt(Math.pow(Math.abs(hit.x - plane.v0.x), 2) + Math.pow(Math.abs(hit.y - plane.v0.y), 2)));
                    hits.push({
                        src: vect,
                        angle: angle,
                        dst: hit,
                        plane: plane,
                        px: px,
                        distance: distance + Math.sqrt(Math.pow(Math.abs(hit.x - vect.x), 2) + Math.pow(Math.abs(hit.y - vect.y), 2)),
                        i: i
                    });
                }
                i++;
            }
        }
        if (hits.length < 1) {
            // this.drawMapLine(vect, new Vect(vect.x + Math.sin(angle * (Math.PI / 180))*0.5, vect.y - Math.cos(angle * (Math.PI / 180))*0.5));
            return null;
        }
        var closestHit = hits.sort(function (h1, h2) { return h1.distance - h2.distance; })[0];
        if (returnHitAlways)
            return closestHit;
        if (drawDebug)
            this.drawMapLine(closestHit.src, closestHit.dst);
        // Determine action
        var act = closestHit.plane.doHit(closestHit);
        switch (act.type) {
            case HitActionType.Render:
                return closestHit;
            case HitActionType.Rewrite:
                if (closestHit.distance > RENDER_DISTANCE || levels + 1 > MAX_RECURSION)
                    return null; // Ray has travelled too far
                return this.sendRay(act.rewrite.src, act.rewrite.angle, closestHit.distance, levels + 1);
        }
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
        if (this.keys[KEY_W] || this.keys[KEY_S]) {
            // Handle possible collision with portal
            var hit = this.sendRay(this.pos, this.keys[KEY_W] ? this.angle : this.angle + 180, 0, 0, true);
            if (hit && hit.plane instanceof PortalPlane && hit.distance <= MOVEMENT * 2) {
                var _a = hit.plane.translate(hit.px, hit.angle), ov = _a[0], angle = _a[1];
                this.pos = ov;
                this.angle = this.keys[KEY_W] ? angle : angle + 180;
            }
        }
        // Draw
        this.draw();
        //this.entities[0].pos.x = Math.sin((Math.PI/180) * this.i) + 3;
        //this.entities[0].pos.y = Math.cos((Math.PI/180) * this.i) + 3;
        this.i++;
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
