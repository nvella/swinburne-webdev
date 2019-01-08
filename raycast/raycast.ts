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

enum HitActionType {
    Render,
    Rewrite
}

type HitAction = {
    type: HitActionType.Render, 
} | {
    type: HitActionType.Rewrite, 
    rewrite: {
        src: Vect,
        angle: number
    }
};

interface IRay {
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
    getStripe(r?: IRay): Colour[];
}

class ColourMaterial extends Colour implements IMaterial {
    getStripe = () => [this];
}

class TextureMaterial implements IMaterial {
    private texture: Texture;
    constructor(texture: Texture) {
        this.texture = texture;
    }

    getStripe(r: IRay) {
        let stripe: Colour[] = [];
        for(let y = 0; y < this.texture.height; y++) {
            stripe.push(this.texture.getPixel(Math.floor((r.px / r.plane.length) * this.texture.width), y));
        }
        return stripe;
    }
}

class XTestMaterial implements IMaterial {
    getStripe = (r: IRay) => r ? [new Colour(Math.abs(255 - r.distance * 8), 255, Math.abs(r.distance * 8))] : [new Colour(255, 0, 0)];
}

class Texture {
    private path: string;
    img: HTMLImageElement;
    imgData: Uint8ClampedArray = null as any;

    constructor(filename: string) {
        this.path = filename;
        this.img = new Image();
    }

    load(): Promise<void> {
        return new Promise<void>((resolve: () => any) => {
            this.img = new Image();
            this.img.crossOrigin = "Anonymous";
            this.img.src = this.path;
            this.img.onload = () => {
                let canvas = document.createElement('canvas');
                let ctx: CanvasRenderingContext2D = canvas.getContext('2d') as any;
                ctx.drawImage(this.img, 0, 0);
                this.imgData = ctx.getImageData(0, 0, this.img.width, this.img.height).data;
                resolve();
            }
        });
    }

    get width(): number {
        return this.img.width;
    }

    get height(): number {
        return this.img.height;
    }

    getPixel(x: number, y: number) {
        return new Colour(
            this.imgData[(this.img.width * y * 4) + (x * 4)],
            this.imgData[(this.img.width * y * 4) + (x * 4) + 1],
            this.imgData[(this.img.width * y * 4) + (x * 4) + 2]
        );
    }
}

class Plane {
    v0: Vect;
    v1: Vect;
    mat: IMaterial;

    constructor(v0: Vect, v1: Vect, mat?: IMaterial) {
        this.v0 = v0;
        this.v1 = v1;
        this.mat = mat || new XTestMaterial();
    }

    get length() {
        return Math.sqrt(Math.abs(this.v1.x-this.v0.x)**2 + Math.abs(this.v1.y-this.v0.y)**2);
    };

    get material() {
        return this.mat;
    }

    doHit(r: IRay): HitAction {
        return {
            type: HitActionType.Render
        };
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
    }

    get opLength() { return Math.sqrt(Math.abs(this.x1.x-this.x0.x)**2 + Math.abs(this.x1.y-this.x0.y)**2); }

    doHit(r: IRay) {
        let [src, angle] = this.translate(r.px, r.angle);

        return <HitAction>{
            type: HitActionType.Rewrite,
            rewrite: { src, angle }
        }
    }

    /** Given a plane X and angle, calculate an output vector and angle */
    translate(px: number, angle: number): [Vect, number] {
        // Calculate output vector and translate angle from input px and angle
        // Calculate portal plane angle
        let ppa = Math.atan2(this.v1.y - this.v0.y, this.v1.x - this.v0.x);
        // Calculate output plane angle
        let opa = Math.atan2(this.x1.y - this.x0.y, this.x1.x - this.x0.x);
        // Delta angle in degs
        let delta = (ppa - opa) * (180 / Math.PI);
        // calculate output plane x
        let opx = (px / this.length) * this.opLength;
        // Translate output hit vector
        let ov = new Vect(this.x0.x + Math.sin(opa+(90*Math.PI/180))*opx, this.x0.y - Math.cos(opa+(90*Math.PI/180))*opx);
        return [ov, angle + delta];
    }

    // TODO Override this in all subclasses returning new class
    addVect = (v: Vect) => new PortalPlane(this.rc, this.v0.add(v), this.v1.add(v), this.x0, this.x1);
}

const KEY_W = 87;
const KEY_A = 65;
const KEY_S = 83;
const KEY_D = 68;
const MOVEMENT = .1;
const RENDER_DISTANCE = 128;
const MAX_RECURSION = 8;

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
    text = new Texture('text.jpg');

    meshes: IMesh[] = [
        new MeshCube(new Vect(2, 2), 1, 1),
        new MeshTriangle(new Vect(5, 5), 1, 1),
        new MeshPlanar(new Vect(10, 10), [
            new Plane(new Vect(1, 0), new Vect(0, 0), new TextureMaterial(this.text)),
        ])
    ];
    pos = new Vect(5.0, 3.0);
    angle = 0; // 0 to 360
    fov = 60;
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
                this.mapCtx.beginPath();
                this.mapCtx.strokeStyle = "red"; //plane.mat.getStripe()[0].rep();
                this.mapCtx.moveTo(plane.v0.x* MAP_SCALE, plane.v0.y* MAP_SCALE);
                this.mapCtx.lineTo(plane.v1.x* MAP_SCALE, plane.v1.y* MAP_SCALE);
                this.mapCtx.stroke();
                this.mapCtx.closePath()

                if(plane instanceof PortalPlane) {
                    this.mapCtx.beginPath()
                    this.mapCtx.strokeStyle = "#f0f";
                    this.mapCtx.moveTo(plane.x0.x* MAP_SCALE, plane.x0.y* MAP_SCALE);
                    this.mapCtx.lineTo(plane.x1.x* MAP_SCALE, plane.x1.y* MAP_SCALE);
                    this.mapCtx.stroke();
                    this.mapCtx.closePath()
                }
            }
            
            // this.mapCtx.fillRect(entity.pos.x * MAP_SCALE, entity.pos.y * MAP_SCALE, MAP_SCALE, MAP_SCALE);
        }
        this.mapCtx.fillStyle = 'black';
        this.drawMapBlip(this.pos);
        this.mapCtx.beginPath();
        this.mapCtx.moveTo(this.pos.x * MAP_SCALE, this.pos.y * MAP_SCALE);
        this.mapCtx.lineTo((this.pos.x + Math.sin((Math.PI / 180) * (this.angle - this.fov / 2))) * MAP_SCALE, 
                           (this.pos.y - Math.cos((Math.PI / 180) * (this.angle - this.fov / 2))) * MAP_SCALE);
        this.mapCtx.stroke();

        this.mapCtx.moveTo(this.pos.x * MAP_SCALE, this.pos.y * MAP_SCALE);
        this.mapCtx.lineTo((this.pos.x + Math.sin((Math.PI / 180) * (this.angle + this.fov / 2))) * MAP_SCALE, 
                           (this.pos.y - Math.cos((Math.PI / 180) * (this.angle + this.fov / 2))) * MAP_SCALE);
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
            let hIndex = (x/(this.canvas.width - 1))*2 - 1;
            let relAngle = ((this.fov / this.canvas.width) * x) - this.fov/2;
            let absAngle = this.angle + relAngle;
            let ray = this.sendRay(this.pos, absAngle, 0, 0, false, true);
            
            if(ray) {
                let height = this.canvas.height / (ray.distance * Math.cos(relAngle * (Math.PI / 180)));
                let stripe = ray.plane.mat.getStripe(ray);
                let div = height / stripe.length;
                for(let y = 0; y < stripe.length; y++) {
                    this.ctx.strokeStyle = stripe[y].rep();
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, (this.canvas.height / 2) - (height / 2) + (y * div));
                    this.ctx.lineTo(x, (this.canvas.height / 2) - (height / 2) + (y * div) + div);
                    this.ctx.stroke();
                }
            }
            this.ctx.closePath();
        }
        
        this.info.innerHTML = `x: ${this.pos.x} y: ${this.pos.y} a: ${this.angle}`;

    }

    // Returns a Ray if the ray hit something
    sendRay(vect: Vect, angle: number, distance = 0, levels = 0, returnHitAlways = false, drawDebug = true): IRay | null {
        let hits: IRay[] = [];
        for(let mesh of this.meshes) {
            let i = 0;
            for(let plane of mesh.absPlanes()) {
                let checkEnd = new Vect(Math.sin((Math.PI / 180) * angle) * RENDER_DISTANCE,
                                 -Math.cos((Math.PI / 180) * angle) * RENDER_DISTANCE);

                let hit = getLineIntersection(vect, checkEnd, plane.v0, plane.v1);
                if(hit) {
                    // Calculate the hit position relative to the plane's surface 
                    let px = Math.abs(Math.sqrt(Math.abs(hit.x - plane.v0.x)**2 + Math.abs(hit.y - plane.v0.y)**2));
                    hits.push({
                        src: vect,
                        angle,
                        dst: hit,
                        plane,
                        px,
                        distance: distance + Math.sqrt(Math.abs(hit.x - vect.x)**2 + Math.abs(hit.y - vect.y)**2),
                        i
                    });
                }
                i++;
            }
        }

        if(hits.length < 1) {
            // this.drawMapLine(vect, new Vect(vect.x + Math.sin(angle * (Math.PI / 180))*0.5, vect.y - Math.cos(angle * (Math.PI / 180))*0.5));
            return null;
        }

        let closestHit = hits.sort((h1, h2) => h1.distance - h2.distance)[0];
        if(returnHitAlways) return closestHit;

        if(drawDebug) this.drawMapLine(closestHit.src, closestHit.dst);
        // Determine action
        let act = closestHit.plane.doHit(closestHit);
        switch(act.type) {
            case HitActionType.Render:
                return closestHit;
            case HitActionType.Rewrite:
                if(closestHit.distance > RENDER_DISTANCE || levels + 1 > MAX_RECURSION) return null; // Ray has travelled too far
                return this.sendRay(act.rewrite.src, act.rewrite.angle, closestHit.distance, levels + 1);
        }
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
        if(this.keys[KEY_W] || this.keys[KEY_S]) {
            // Handle possible collision with portal
            let hit = this.sendRay(this.pos, this.keys[KEY_W] ? this.angle : this.angle + 180, 0, 0, true);
            if(hit && hit.plane instanceof PortalPlane && hit.distance <= MOVEMENT * 2) {
                let [ov, angle] = (<PortalPlane>hit.plane).translate(hit.px, hit.angle);
                this.pos = ov;
                this.angle = this.keys[KEY_W] ? angle : angle + 180;
            }
        }
        // Draw
        this.draw();

        //this.entities[0].pos.x = Math.sin((Math.PI/180) * this.i) + 3;
        //this.entities[0].pos.y = Math.cos((Math.PI/180) * this.i) + 3;
        this.i++;
    }

    async start() {
        // Load textures
        await this.text.load();
        // Set draw interval
        setInterval(() => this.update(), 1000 / 60);
        // Set input handlers
        window.onkeyup = (e ) => { this.keys[e.keyCode] = false; }
        window.onkeydown = (e) => { this.keys[e.keyCode] = true; }
    }
}