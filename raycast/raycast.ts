class Vect {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add = (v: Vect) => new Vect(this.x + v.x, this.y + v.y);
    sub = (v: Vect) => new Vect(this.x - v.x, this.y - v.y);
    mul = (v: Vect | number) => (v instanceof Vect) ? new Vect(this.x * v.x, this.y * v.y) : new Vect(this.x * v, this.y * v);
    div = (v: Vect | number) => (v instanceof Vect) ? new Vect(this.x * v.x, this.y * v.y) : new Vect(this.x / v, this.y / v);
}

class Colour {
    r: number;
    g: number;
    b: number;

    constructor(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    mul = (mul: number) => new Colour(this.r * mul, this.g * mul, this.b * mul);
    rep = () => `rgba(${this.r}, ${this.g}, ${this.b}, 1.0)`;
}

interface Ray {
    src: Vect;
    angle: number;
    
    dst: Vect;
    plane: Plane;
    /** x from 0 to plane width, describing where along the plane's surface was hit */
    px: number;

    distance: number;
    i: number;
}

interface IMaterial {
    /**
     * @param r The responsible Ray
     */
    getStripe(r?: Ray): Colour[];
}

class ColourMaterial extends Colour implements IMaterial {
    getStripe = () => [this];
}

class Plane {
    v0: Vect;
    v1: Vect;
    mat: IMaterial;

    constructor(v0: Vect, v1: Vect, mat?: IMaterial) {
        this.v0 = v0;
        this.v1 = v1;
        this.mat = mat || new ColourMaterial(255, 0, 0);
    }

    // TODO Override this in all subclasses returning new class
    addVect = (v: Vect) => new Plane(this.v0.add(v), this.v1.add(v), this.mat);
}

interface IMesh {
    planes: Plane[];
    origin: Vect;

    absPlanes: () => Plane[];
}

class MeshBase implements IMesh {
    planes: Plane[] = [];
    origin: Vect = new Vect(0, 0);

    absPlanes = () => this.planes.map((p) => p.addVect(this.origin));
}

class MeshPlanar extends MeshBase implements IMesh {
    constructor(origin: Vect, planes: Plane[]) {
        super();
        this.origin = origin;
        this.planes = planes;
    }
}

class MeshCube extends MeshBase implements IMesh {
    constructor(origin: Vect, w: number, l: number) {
        super();
        this.origin = origin;
        this.setGeometry(w, l);
    }

    setGeometry = (w: number, l: number) => this.planes = [
        new Plane(new Vect(0, 0), new Vect(w, 0)),
        new Plane(new Vect(0, 0), new Vect(0, l)),
        new Plane(new Vect(w, 0), new Vect(w, l)),
        new Plane(new Vect(0, l), new Vect(w, l)),
    ];
}

class MeshTriangle extends MeshBase implements IMesh {
    constructor(origin: Vect, w: number, l: number) {
        super();
        this.origin = origin;
        this.setGeometry(w, l);
    }

    setGeometry = (w: number, l: number) => this.planes = [
        new Plane(new Vect(0, 0), new Vect(w, 0)),
        new Plane(new Vect(0, 0), new Vect(w / 2, l)),
        new Plane(new Vect(w, 0), new Vect(w / 2, l))
    ];
}

class PortalPlane extends Plane {
    rc: Raycast;
    x0: Vect;
    x1: Vect;

    constructor(rc: Raycast, v0: Vect, v1: Vect, x0: Vect, x1: Vect) {
        super(v0, v1);
        this.rc = rc;
        this.x0 = x0;
        this.x1 = x1;
        this.mat = new PortalMaterial(rc, this);
    }

    // TODO Override this in all subclasses returning new class
    addVect = (v: Vect) => new PortalPlane(this.rc, this.v0.add(v), this.v1.add(v), this.x0, this.x1);
}

class PortalMaterial implements IMaterial {
    raycast: Raycast;
    pp: PortalPlane;

    constructor(raycast: Raycast, pp: PortalPlane) {
        this.raycast = raycast;
        this.pp = pp;
    }

    getStripe(r?: Ray): Colour[] {
        if(typeof(r) === 'undefined') return [new Colour(0,0xff,0)];

        // TODO determine relative locations
        // Translate angle
        // Calculate portal plane angle
        let ppa = Math.atan2(this.pp.v1.y - this.pp.v0.y, this.pp.v1.x - this.pp.v0.x);
        // Calculate output plane angle
        let opa = Math.atan2(this.pp.x1.y - this.pp.x0.y, this.pp.x1.x - this.pp.x0.x);
        // Delta angle in degs
        let delta = (ppa - opa) * (180 / Math.PI);
        // Translate output hit vector
        let ov = new Vect(this.pp.x0.x + Math.sin(opa+(90*Math.PI/180))*r.px, this.pp.x0.y - Math.cos(opa+(90*Math.PI/180))*r.px);
        
        let hit = this.raycast.sendRay(ov, r.angle + delta); // TODO relative location on output plane and send ray from there
        if(!hit) return [new Colour(0, 0, 0)];
        return hit.plane.mat.getStripe(hit); // TODO calculate where on the inner portal object was hit
    }
}

class MeshPortal extends MeshBase implements IMesh {
    constructor(rc: Raycast, orig: Vect, dst: Vect, w: number) {
        super();
        this.origin = orig;
        this.planes = [
            new PortalPlane(rc, orig, orig.add(new Vect(w, 0)), dst, dst.add(new Vect(w, 0)))
        ];
    }
}

const KEY_W = 87;
const KEY_A = 65;
const KEY_S = 83;
const KEY_D = 68;
const MOVEMENT = .1;
const RENDER_DISTANCE = 256;

const MAP_SCALE = 32;
const MAP_BLIP = 1;

const mod = (x: number, n: number) => (x % n + n) % n

const getLineIntersection = (p0: Vect, 
                             p1: Vect,
                             p2: Vect,
                             p3: Vect): Vect | null =>
{
    let s1x: number, s1y: number, s2x: number, s2y: number;
    s1x = p1.x - p0.x;
    s1y = p1.y - p0.y;
    s2x = p3.x - p2.x;
    s2y = p3.y - p2.y;

    let s: number, t: number;
    s = (-s1y * (p0.x - p2.x) + s1x * (p0.y - p2.y)) / (-s2x * s1y + s1x * s2y);
    t = ( s2x * (p0.y - p2.y) - s2y * (p0.x - p2.x)) / (-s2x * s1y + s1x * s2y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    {
        // Collision detected
        return new Vect(p0.x + (t * s1x), p0.y + (t * s1y));
    }

    return null; // No collision
}

class Raycast {
    meshes: IMesh[] = [
        new MeshCube(new Vect(5, 5), 1, 1),
        new MeshTriangle(new Vect(7, 5), 2, 2),
        new MeshPlanar(new Vect(7, 2), [
            new PortalPlane(this, new Vect(0, 0), new Vect(0, 2), new Vect(9, 10), new Vect(7, 10))
        ])
    ];
    pos = new Vect(0.0, 0.0);
    angle = 0.0; // 0 to 360
    pov = 75;
    keys: {[k: number]: boolean} = {};
    canvas: HTMLCanvasElement;
    info: HTMLDivElement;
    ctx: CanvasRenderingContext2D;
    i: number = 0;

    map: HTMLCanvasElement;
    mapCtx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, info: HTMLDivElement, map: HTMLCanvasElement) {
        this.canvas = canvas;
        this.info = info;
        this.ctx = canvas.getContext('2d') as any;
        this.map = map;
        this.mapCtx = map.getContext('2d') as any;
    }

    drawMapBlip(v: Vect) {
        this.mapCtx.beginPath();
        this.mapCtx.arc(v.x * MAP_SCALE, v.y * MAP_SCALE, MAP_BLIP, 0, 2*Math.PI);
        this.mapCtx.stroke();
    }

    drawMapLine(l1: Vect, l2: Vect) {
        this.mapCtx.beginPath();
        this.mapCtx.moveTo(l1.x * MAP_SCALE, l1.y * MAP_SCALE);
        this.mapCtx.lineTo(l2.x * MAP_SCALE, l2.y * MAP_SCALE);
        this.mapCtx.stroke();
    }

    drawMap() {
        // do a backflip
        this.mapCtx.clearRect(0, 0, this.map.width, this.map.height);
        for(let mesh of this.meshes) {
            for(let plane of mesh.absPlanes()) {
                this.mapCtx.strokeStyle = plane.mat.getStripe()[0].rep();
                this.mapCtx.moveTo(plane.v0.x* MAP_SCALE, plane.v0.y* MAP_SCALE);
                this.mapCtx.lineTo(plane.v1.x* MAP_SCALE, plane.v1.y* MAP_SCALE);
                this.mapCtx.stroke();

                if(plane instanceof PortalPlane) {
                    this.mapCtx.strokeStyle = "#f0f";
                    this.mapCtx.moveTo(plane.x0.x* MAP_SCALE, plane.x0.y* MAP_SCALE);
                    this.mapCtx.lineTo(plane.x1.x* MAP_SCALE, plane.x1.y* MAP_SCALE);
                    this.mapCtx.stroke();
                }
            }
            
            // this.mapCtx.fillRect(entity.pos.x * MAP_SCALE, entity.pos.y * MAP_SCALE, MAP_SCALE, MAP_SCALE);
        }
        this.mapCtx.fillStyle = 'black';
        this.drawMapBlip(this.pos);
        this.mapCtx.beginPath();
        this.mapCtx.moveTo(this.pos.x * MAP_SCALE, this.pos.y * MAP_SCALE);
        this.mapCtx.lineTo((this.pos.x + Math.sin((Math.PI / 180) * (this.angle - this.pov / 2))) * MAP_SCALE, 
                           (this.pos.y - Math.cos((Math.PI / 180) * (this.angle - this.pov / 2))) * MAP_SCALE);
        this.mapCtx.stroke();
        this.mapCtx.moveTo(this.pos.x * MAP_SCALE, this.pos.y * MAP_SCALE);
        this.mapCtx.lineTo((this.pos.x + Math.sin((Math.PI / 180) * (this.angle + this.pov / 2))) * MAP_SCALE, 
                           (this.pos.y - Math.cos((Math.PI / 180) * (this.angle + this.pov / 2))) * MAP_SCALE);
        this.mapCtx.stroke();
        this.mapCtx.moveTo(this.pos.x * MAP_SCALE, this.pos.y * MAP_SCALE);
        this.mapCtx.lineTo((this.pos.x + Math.sin((Math.PI / 180) * this.angle)) * MAP_SCALE, 
                           (this.pos.y - Math.cos((Math.PI / 180) * this.angle)) * MAP_SCALE);
        this.mapCtx.stroke();
    }

    draw() {
        this.drawMap();
        for(let x = 0; x < this.canvas.width; x++) {
            this.ctx.strokeStyle = "#000";
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();

            // Send ray
            let relAngle = (this.angle - this.pov / 2) + ((this.pov / this.canvas.width) * x);
            let ray = this.sendRay(this.pos, relAngle);
            
            if(ray) {
                let height = this.canvas.height / ray.distance;
                let stripe = ray.plane.mat.getStripe(ray);
                this.ctx.strokeStyle = (stripe[0].mul(ray.i < 2 ? 1 : 0.8)).rep();
                this.ctx.beginPath();
                this.ctx.moveTo(x, (this.canvas.height / 2) - (height / 2));
                this.ctx.lineTo(x, (this.canvas.height / 2) + (height / 2));
                this.ctx.stroke();
            }
        }

        this.info.innerHTML = `x: ${this.pos.x} y: ${this.pos.y} a: ${this.angle}`;
    }

    // Returns a Ray if the ray hit something
    sendRay(vect: Vect, angle: number): Ray | null {
        let hits: Ray[] = [];
        for(let mesh of this.meshes) {
            let i = 0;
            for(let plane of mesh.absPlanes()) {
                let checkEnd = new Vect(Math.sin((Math.PI / 180) * angle) * RENDER_DISTANCE,
                                 -Math.cos((Math.PI / 180) * angle) * RENDER_DISTANCE);

                let hit = getLineIntersection(vect, checkEnd, plane.v0, plane.v1);
                if(hit) {
                    // Calculate the hit position relative to the plane's surface 
                    let px = Math.sqrt(Math.abs(hit.x - plane.v0.x)**2 + Math.abs(hit.y - plane.v0.y)**2);
                    hits.push({
                        src: vect,
                        angle,
                        dst: hit,
                        plane,
                        px,
                        distance: Math.sqrt(Math.abs(hit.x - vect.x)**2 + Math.abs(hit.y - vect.y)**2),
                        i
                    });
                }
                i++;
            }
        }

        if(hits.length < 1) {
            this.drawMapLine(vect, new Vect(vect.x + Math.sin(angle * (Math.PI / 180))*0.5, vect.y - Math.cos(angle * (Math.PI / 180))*0.5));
            return null;
        }
        let closestHit = hits.sort((h1, h2) => h1.distance - h2.distance)[0];
        //this.drawMapLine(closestHit.src, closestHit.dst);
        return closestHit;
    }

    update() {
        // Handle input
        if(this.keys[KEY_A]) this.angle = mod(this.angle - 2, 360);
        if(this.keys[KEY_D]) this.angle = mod(this.angle + 2, 360);
        if(this.keys[KEY_W]) {
            this.pos.x +=  Math.sin((Math.PI / 180) * this.angle) * MOVEMENT;
            this.pos.y += -Math.cos((Math.PI / 180) * this.angle) * MOVEMENT;
        }
        if(this.keys[KEY_S]) {
            this.pos.x -=  Math.sin((Math.PI / 180) * this.angle) * MOVEMENT;
            this.pos.y -= -Math.cos((Math.PI / 180) * this.angle) * MOVEMENT;
        }
        // Draw
        this.draw();

        //this.entities[0].pos.x = Math.sin((Math.PI/180) * this.i) + 3;
        //this.entities[0].pos.y = Math.cos((Math.PI/180) * this.i) + 3;
        this.i++;
    }

    start() {
        // Set draw interval
        setInterval(() => this.update(), 1000 / 60);
        // Set input handlers
        window.onkeyup = (e ) => { this.keys[e.keyCode] = false; }
        window.onkeydown = (e) => { this.keys[e.keyCode] = true; }
    }
}