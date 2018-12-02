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
var ColourMaterial = /** @class */ (function (_super) {
    __extends(ColourMaterial, _super);
    function ColourMaterial() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.getStripe = function () { return [_this]; };
        return _this;
    }
    return ColourMaterial;
}(Colour));
var Plane = /** @class */ (function () {
    function Plane(v0, v1, mat) {
        var _this = this;
        // TODO Override this in all subclasses returning new class
        this.addVect = function (v) { return new Plane(_this.v0.add(v), _this.v1.add(v), _this.mat); };
        this.v0 = v0;
        this.v1 = v1;
        this.mat = mat || new ColourMaterial(255, 0, 0);
    }
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
        _this.mat = new PortalMaterial(rc, _this);
        return _this;
    }
    return PortalPlane;
}(Plane));
var PortalMaterial = /** @class */ (function () {
    function PortalMaterial(raycast, pp) {
        this.raycast = raycast;
        this.pp = pp;
    }
    PortalMaterial.prototype.getStripe = function (r) {
        if (typeof (r) === 'undefined')
            return [new Colour(0, 0xff, 0)];
        // TODO determine relative locations
        // Translate angle
        // Calculate portal plane angle
        var ppa = Math.atan2(this.pp.v1.y - this.pp.v0.y, this.pp.v1.x - this.pp.v0.x);
        // Calculate output plane angle
        var opa = Math.atan2(this.pp.x1.y - this.pp.x0.y, this.pp.x1.x - this.pp.x0.x);
        // Delta angle in degs
        var delta = (ppa - opa) * (180 / Math.PI);
        // Translate output hit vector
        var ov = new Vect(this.pp.x0.x + Math.sin(opa + (90 * Math.PI / 180)) * r.px, this.pp.x0.y - Math.cos(opa + (90 * Math.PI / 180)) * r.px);
        var hit = this.raycast.sendRay(ov, r.angle + delta); // TODO relative location on output plane and send ray from there
        if (!hit)
            return [new Colour(0, 0, 0)];
        return hit.plane.mat.getStripe(hit); // TODO calculate where on the inner portal object was hit
    };
    return PortalMaterial;
}());
var MeshPortal = /** @class */ (function (_super) {
    __extends(MeshPortal, _super);
    function MeshPortal(rc, orig, dst, w) {
        var _this = _super.call(this) || this;
        _this.origin = orig;
        _this.planes = [
            new PortalPlane(rc, orig, orig.add(new Vect(w, 0)), dst, dst.add(new Vect(w, 0)))
        ];
        return _this;
    }
    return MeshPortal;
}(MeshBase));
var KEY_W = 87;
var KEY_A = 65;
var KEY_S = 83;
var KEY_D = 68;
var MOVEMENT = .1;
var RENDER_DISTANCE = 256;
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
            new MeshCube(new Vect(5, 5), 1, 1),
            new MeshTriangle(new Vect(7, 5), 2, 2),
            new MeshPlanar(new Vect(7, 2), [
                new PortalPlane(this, new Vect(0, 0), new Vect(0, 2), new Vect(9, 10), new Vect(7, 10))
            ])
        ];
        this.pos = new Vect(0.0, 0.0);
        this.angle = 0.0; // 0 to 360
        this.pov = 75;
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
                this.mapCtx.strokeStyle = plane.mat.getStripe()[0].rep();
                this.mapCtx.moveTo(plane.v0.x * MAP_SCALE, plane.v0.y * MAP_SCALE);
                this.mapCtx.lineTo(plane.v1.x * MAP_SCALE, plane.v1.y * MAP_SCALE);
                this.mapCtx.stroke();
                if (plane instanceof PortalPlane) {
                    this.mapCtx.strokeStyle = "#f0f";
                    this.mapCtx.moveTo(plane.x0.x * MAP_SCALE, plane.x0.y * MAP_SCALE);
                    this.mapCtx.lineTo(plane.x1.x * MAP_SCALE, plane.x1.y * MAP_SCALE);
                    this.mapCtx.stroke();
                }
            }
            // this.mapCtx.fillRect(entity.pos.x * MAP_SCALE, entity.pos.y * MAP_SCALE, MAP_SCALE, MAP_SCALE);
        }
        this.mapCtx.fillStyle = 'black';
        this.drawMapBlip(this.pos);
        this.mapCtx.beginPath();
        this.mapCtx.moveTo(this.pos.x * MAP_SCALE, this.pos.y * MAP_SCALE);
        this.mapCtx.lineTo((this.pos.x + Math.sin((Math.PI / 180) * (this.angle - this.pov / 2))) * MAP_SCALE, (this.pos.y - Math.cos((Math.PI / 180) * (this.angle - this.pov / 2))) * MAP_SCALE);
        this.mapCtx.stroke();
        this.mapCtx.moveTo(this.pos.x * MAP_SCALE, this.pos.y * MAP_SCALE);
        this.mapCtx.lineTo((this.pos.x + Math.sin((Math.PI / 180) * (this.angle + this.pov / 2))) * MAP_SCALE, (this.pos.y - Math.cos((Math.PI / 180) * (this.angle + this.pov / 2))) * MAP_SCALE);
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
            var relAngle = (this.angle - this.pov / 2) + ((this.pov / this.canvas.width) * x);
            var ray = this.sendRay(this.pos, relAngle);
            if (ray) {
                var height = this.canvas.height / ray.distance;
                var stripe = ray.plane.mat.getStripe(ray);
                this.ctx.strokeStyle = (stripe[0].mul(ray.i < 2 ? 1 : 0.8)).rep();
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
                    var px = Math.sqrt(Math.pow(Math.abs(hit.x - plane.v0.x), 2) + Math.pow(Math.abs(hit.y - plane.v0.y), 2));
                    hits.push({
                        src: vect,
                        angle: angle,
                        dst: hit,
                        plane: plane,
                        px: px,
                        distance: Math.sqrt(Math.pow(Math.abs(hit.x - vect.x), 2) + Math.pow(Math.abs(hit.y - vect.y), 2)),
                        i: i
                    });
                }
                i++;
            }
        }
        if (hits.length < 1) {
            this.drawMapLine(vect, new Vect(vect.x + Math.sin(angle * (Math.PI / 180)) * 0.5, vect.y - Math.cos(angle * (Math.PI / 180)) * 0.5));
            return null;
        }
        var closestHit = hits.sort(function (h1, h2) { return h1.distance - h2.distance; })[0];
        //this.drawMapLine(closestHit.src, closestHit.dst);
        return closestHit;
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
