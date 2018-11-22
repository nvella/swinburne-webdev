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

interface Ray {
    src: Vect;
    angle: number;
    
    dst: Vect;
    entity: Entity;

    distance: number;
}

interface Entity {
    pos: Vect;
    color: string;
}

const KEY_W = 87;
const KEY_A = 65;
const KEY_S = 83;
const KEY_D = 68;
const MOVEMENT = .5;
const RENDER_DISTANCE = 256;

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
    entities: Entity[] = [
        {pos: new Vect(1, 1), color: '#f00'}
        //{pos: new Vect(2, 1), color: '#0f0'},
        //{pos: new Vect(3, 1), color: '#00f'},
        //{pos: new Vect(1, 2), color: '#ff0'},
        //{pos: new Vect(1, 3), color: '#0ff'}
    ];
    pos = new Vect(0.0, 0.0);
    angle = 0.0; // 0 to 360
    pov = 80;
    keys: {[k: number]: boolean} = {};
    canvas: HTMLCanvasElement;
    info: HTMLDivElement;
    ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement, info: HTMLDivElement) {
        this.canvas = canvas;
        this.info = info;
        this.ctx = canvas.getContext('2d') as any;
    }

    draw() {
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
                this.ctx.strokeStyle = ray.entity.color;
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
        let dists: Ray[] = [];
        for(let entity of this.entities) {
            let walls = [
                // p3x              p3y                                   p4x             p4y
                [new Vect(entity.pos.x, entity.pos.y),     new Vect(entity.pos.x + 1, entity.pos.y)],
                [new Vect(entity.pos.x + 1, entity.pos.y), new Vect(entity.pos.x + 1, entity.pos.y + 1)],
                [new Vect(entity.pos.x, entity.pos.y),     new Vect(entity.pos.x,     entity.pos.y + 1)],
                [new Vect(entity.pos.x, entity.pos.y + 1), new Vect(entity.pos.x + 1, entity.pos.y + 1)],
            ];

            let i = 0;

            let temp = ['#f00', '#0f0', '#00f', '#ff0'];

            for(let wall of walls) {
                let p0 = vect;
                let p1 = new Vect(Math.sin((Math.PI / 180) * angle) * RENDER_DISTANCE,
                                 -Math.cos((Math.PI / 180) * angle) * RENDER_DISTANCE);
                let p2 = wall[0];
                let p3 = wall[1];

                let hit = getLineIntersection(p0, p1, p2, p3);
                if(hit) dists.push({
                    src: vect,
                    angle,
                    dst: hit,
                    entity: {
                        pos: entity.pos,
                        color: temp[i]
                    },
                    distance: Math.sqrt((hit.x - vect.x)**2 + (hit.y - vect.y)**2)
                });
                i++;
            }
        }

        if(dists.length < 1) return null;
        return dists.sort((o) => o.distance)[0] || null;
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
    }

    start() {
        // Set draw interval
        setInterval(() => this.update(), 1000 / 60);
        // Set input handlers
        window.onkeyup = (e ) => { this.keys[e.keyCode] = false; }
        window.onkeydown = (e) => { this.keys[e.keyCode] = true; }
    }
}