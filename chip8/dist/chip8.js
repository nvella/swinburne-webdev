const MAX_WORD = 255;
const MAX_ADDR = (1 << 16) - 1;
// Stack grows down from Begin to End
const STACK_BEGIN = 0xEFF;
const STACK_END = 0xEA0;
const xyToAddrMask = (x, y) => [0xF00 + ((y * 64 + x) / 8 | 0), 1 << (7 - (x % 8))];
class Chip8 {
    constructor(canvas, program) {
        this.ram = [];
        this.regs = [];
        this.vf = 0; // carry register
        this.i = 0; // address register
        this.pc = 0x200; // program counter 
        this.stack = []; // store stack separately to save time
        this.key = 0; // current key pressed
        this.delay = 0; // delay timer
        this.delayTime = null; // time set
        this.beep = 0; // beep timer
        this.opcodes = {
            '0NNN': async (p) => 0,
            '00E0': async (p) => { for (let i = 0xf00; i <= 0xfff; i++)
                this.ram[i] = 0; return 1; },
            '00EE': async (p) => { if (this.stack.length > 0)
                this.pc = this.stackPop(); return 1; },
            '1NNN': async (p) => { this.pc = p.addr; return 0; },
            '2NNN': async (p) => { this.stackPush(this.pc); this.pc = p.addr; return 0; },
            '3XNN': async (p) => (this.regs[p.x] === p.const8) ? 2 : 1,
            '4XNN': async (p) => (this.regs[p.x] !== p.const8) ? 2 : 1,
            '5XY0': async (p) => (this.regs[p.x] !== this.regs[p.y]) ? 2 : 1,
            '6XNN': async (p) => { this.regs[p.x] = p.const8; return 1; },
            '7XNN': async (p) => { this.regs[p.x] = (this.regs[p.x] + p.const8) & MAX_WORD; return 1; },
            '8XY0': async (p) => { this.regs[p.x] = this.regs[p.y]; return 1; },
            '8XY1': async (p) => { this.regs[p.x] |= this.regs[p.y]; return 1; },
            '8XY2': async (p) => { this.regs[p.x] &= this.regs[p.y]; return 1; },
            '8XY3': async (p) => { this.regs[p.x] ^= this.regs[p.y]; return 1; },
            '8XY4': async (p) => {
                this.vf = (this.regs[p.x] + this.regs[p.y]) > MAX_WORD ? 1 : 0;
                this.regs[p.x] = (this.regs[p.x] + this.regs[p.y]) & MAX_WORD;
                return 1;
            },
            '8XY5': async (p) => {
                this.vf = (this.regs[p.x] - this.regs[p.y]) < 0 ? 0 : 1;
                this.regs[p.x] = (this.regs[p.x] - this.regs[p.y]) & MAX_WORD;
                return 1;
            },
            '8XY6': async (p) => {
                this.vf = this.regs[p.x] & 1;
                this.regs[p.x] >>= 1;
                return 1;
            },
            '8XY7': async (p) => {
                this.vf = (this.regs[p.y] - this.regs[p.x]) < 0 ? 0 : 1;
                this.regs[p.x] = (this.regs[p.y] - this.regs[p.x]) & MAX_WORD;
                return 1;
            },
            '8XYE': async (p) => {
                this.vf = (this.regs[p.x] & 128) ? 1 : 0;
                this.regs[p.x] <<= 1;
                return 1;
            },
            '9XY0': async (p) => (this.regs[p.x] != this.regs[p.y]) ? 2 : 1,
            'ANNN': async (p) => { this.i = p.addr; return 1; },
            'BNNN': async (p) => { this.pc = (p.addr + this.regs[0]) & MAX_ADDR; return 1; },
            'CXNN': async (p) => { this.regs[p.x] = (Math.random() * MAX_WORD | 0) & p.const8; return 1; },
            'DXYN': async (p) => { this.drawSprite(this.i, p.const4, this.regs[p.x], this.regs[p.y]); return 1; },
            'EX9E': async (p) => (this.key === this.regs[p.x]) ? 2 : 1,
            'EXA1': async (p) => (this.key !== this.regs[p.x]) ? 2 : 1,
            'FX07': async (p) => {
                this.regs[p.x] = this.delayTime ?
                    Math.max(this.delay - ((new Date() - this.delayTime) / (1000 / 60)), 0) | 0 : 0;
                return 1;
            },
            'FX0A': async (p) => { this.regs[p.x] = await this.getKey(); return 1; },
            'FX15': async (p) => { this.delay = this.regs[p.x]; this.delayTime = new Date(); return 1; },
            'FX18': async (p) => { this.beep = this.regs[p.x]; return 1; },
            'FX1E': async (p) => { this.i = (this.i + this.regs[p.x]) & MAX_ADDR; return 1; },
            'FX29': async (p) => { this.i = Math.max(this.regs[p.x] * 5, 15 * 5); return 1; },
            'FX33': async (p) => {
                this.ram[this.i] = (this.regs[p.x] / 100 | 0) % 100;
                this.ram[this.i + 1] = (this.regs[p.x] / 10 | 0) % 10;
                this.ram[this.i + 2] = this.regs[p.x] % 10;
                return 1;
            },
            'FX55': async (p) => {
                for (let i = 0; i <= p.x; i++)
                    this.ram[this.i + i] = this.regs[i];
                return 1;
            },
            'FX65': async (p) => {
                for (let i = 0; i <= p.x; i++)
                    this.regs[i] = this.ram[this.i + i];
                return 1;
            }
        };
        this.canvas = canvas;
        this.screen = this.canvas.getContext('2d').createImageData(64, 32);
        // Clear ram
        for (let i = 0; i < 4096; i++)
            this.ram[i] = 0;
        // Insert rom
        for (let i = 0; i < rom.length; i++)
            this.ram[i] = rom[i];
        // Clear regs
        for (let i = 0; i <= 0xf; i++)
            this.regs[i] = 0;
    }
    async tick() {
        // Grab instruction
        let opcode = this.ram[this.pc] << 8 | this.ram[this.pc + 1];
        console.log(`I: ${this.i} `);
        let increment = await this.parseIns(opcode)();
        this.pc = (this.pc + (increment * 2)) & MAX_ADDR;
    }
    async loop() {
        await this.tick();
        this.render();
        setTimeout(() => this.loop(), 1);
    }
    parseIns(opcode) {
        let str = opcode.toString(16).padStart(4, '0').toUpperCase();
        if (this.opcodes[str])
            return () => this.opcodes[str]({}); // Found exact match
        const vars = {
            'NNN': 'addr',
            'NN': 'const8',
            'N': 'const4',
            'X': 'x',
            'Y': 'y'
        };
        const wildcards = ['X', 'Y', 'N'];
        // Find best match
        // Index opcodes by amount of matching literals
        let matches = {};
        for (let mask in this.opcodes) {
            matches[mask] = 0;
            // Match literals
            for (let i = 0; i < 4; i++) {
                if (mask[i] === str[i] || wildcards.includes(mask[i]))
                    matches[mask]++;
                // else
                //     break;
            }
        }
        // Find best match from most amount of matched literals first.
        for (let i = 4; i > 0; i--) {
            for (let k in matches) {
                if (matches[k] === i) {
                    // Match located
                    // Fill variables
                    let p = {};
                    for (let v in vars) {
                        if (k.includes(v))
                            p[vars[v]] = parseInt(str.slice(k.indexOf(v), k.indexOf(v) + v.length), 16);
                    }
                    return () => {
                        console.log(`PC ${this.pc.toString(16)} Op ${str} Match ${k} OpParams ${JSON.stringify(p)} Regs ${JSON.stringify(this.regs)}`);
                        return this.opcodes[k](p);
                    };
                }
            }
        }
    }
    stackPush(data) {
        data = data & MAX_ADDR; // Clamp address
        this.stack.push(data);
    }
    stackPop() {
        return this.stack.pop();
    }
    drawSprite(spriteAddr, height, beginX, beginY) {
        this.vf = 0;
        for (let y = beginY; y < beginY + height; y++) {
            for (let x = beginX; x < beginX + 8; x++) {
                let addr = xyToAddrMask(x, y)[0];
                let mask = xyToAddrMask(x, y)[1];
                if ((this.ram[addr] & mask) > 0)
                    this.vf = 1; // Set the VF flag if a pixel has collided
                let spriteMask = 1 << (7 - x);
                let xor = mask & ((spriteAddr[y - beginY] & spriteMask) > 0 ? 255 : 0);
                this.ram[addr] ^= mask;
            }
        }
    }
    render() {
        let ctx = this.canvas.getContext('2d');
        let id = ctx.createImageData(64, 32); // only do this once per page
        let d = id.data; // only do this once per page
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 64; x++) {
                let i = xyToAddrMask(x, y)[0]; // 0xF00 + ((y * 64 + x) / 8 | 0);
                let mask = xyToAddrMask(x, y)[1];
                // this.ram[i] = Math.random() * 255 | 0;
                let val = (this.ram[i] & mask) > 0 ? 255 : 0;
                d[(y * 64 * 4) + (x * 4)] = val;
                d[(y * 64 * 4) + (x * 4) + 1] = val;
                d[(y * 64 * 4) + (x * 4) + 2] = val;
                d[(y * 64 * 4) + (x * 4) + 3] = 255;
            }
        }
        ctx.putImageData(id, 0, 0);
    }
    // Blocks until key is pressed, returns as ascii
    getKey() {
        // TODO implement
        return new Promise((resolve) => setTimeout(() => resolve(0), 1000));
    }
}
class ChipMonitor {
    constructor(form, chip) {
        this.onStep = async () => {
            await this.chip.tick();
            this.chip.render();
            this.renderMem();
        };
        this.onStart = () => {
            this.interval = setInterval(this.onStep, 1);
        };
        this.onStop = async () => {
            clearInterval(this.interval);
        };
        this.pretty = (addr) => addr.toString(16).toUpperCase().padStart(4, '0');
        this.form = form;
        this.chip = chip;
        this.memDump = this.form.getElementsByClassName('mem')[0];
        this.form.getElementsByClassName("btn-step")[0].onclick =
            this.onStep;
        this.form.getElementsByClassName("btn-start")[0].onclick =
            this.onStart;
        this.form.getElementsByClassName("btn-stop")[0].onclick =
            this.onStop;
    }
    renderMem() {
        let dump = `PC: ${this.pretty(this.chip.pc)} I: ${this.pretty(this.chip.i)}\n`;
        for (let i = 0; i < 16; i++) {
            dump += `V${i.toString(16)}: ${this.chip.regs[i]} `;
        }
        dump += `\ndelay: ${Math.max(this.chip.delay - ((new Date() - this.chip.delayTime) / (1000 / 60)), 0) | 0} beep: ${this.chip.beep}\n`;
        for (let i in this.chip.ram) {
            let addr = parseInt(i);
            if (addr % 32 == 0)
                dump += this.pretty(addr) + ': ';
            if (this.chip.pc === addr || this.chip.pc + 1 === addr)
                dump += "<b>";
            dump += this.chip.ram[i].toString(16).toUpperCase().padStart(2, '0') + ' ';
            if (this.chip.pc === addr || this.chip.pc + 1 === addr)
                dump += "</b>";
            if (addr % 32 == 31)
                dump += "\n";
        }
        this.memDump.innerHTML = dump;
    }
}
