var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const MAX_WORD = 255;
const MAX_ADDR = (1 << 16) - 1;
class Chip8 {
    constructor(canvas, program) {
        this.ram = [];
        this.regs = [];
        this.vf = 0; // carry register
        this.i = 0; // address register
        this.pc = 0; // program counter 
        this.key = 0; // current key pressed
        this.delay = 0; // delay timer
        this.beep = 0; // beep timer
        this.opcodes = {
            '0NNN': () => __awaiter(this, void 0, void 0, function* () { }),
            '00E0': () => __awaiter(this, void 0, void 0, function* () { for (let i = 0xf00; i <= 0xfff; i++)
                this.ram[i] = 0; }),
            '00EE': () => __awaiter(this, void 0, void 0, function* () { }),
            '1NNN': (p) => __awaiter(this, void 0, void 0, function* () { this.pc = p.addr; return 0; }),
            '2NNN': (p) => __awaiter(this, void 0, void 0, function* () { }),
            '3XNN': (p) => __awaiter(this, void 0, void 0, function* () { if (this.regs[p.x] === p.const8)
                return 2; }),
            '4XNN': (p) => __awaiter(this, void 0, void 0, function* () { if (this.regs[p.x] !== p.const8)
                return 2; }),
            '5XY0': (p) => __awaiter(this, void 0, void 0, function* () { if (this.regs[p.x] !== this.regs[p.y])
                return 2; }),
            '6XNN': (p) => __awaiter(this, void 0, void 0, function* () { this.regs[p.x] = p.const8; }),
            '7XNN': (p) => __awaiter(this, void 0, void 0, function* () {
                this.vf = (this.regs[p.x] + p.const8) > MAX_WORD ? 1 : 0;
                this.regs[p.x] = (this.regs[p.x] + p.const8) & MAX_WORD;
            }),
            '8XY0': (p) => __awaiter(this, void 0, void 0, function* () { this.regs[p.x] = this.regs[p.y]; }),
            '8XY1': (p) => __awaiter(this, void 0, void 0, function* () { this.regs[p.x] |= this.regs[p.y]; }),
            '8XY2': (p) => __awaiter(this, void 0, void 0, function* () { this.regs[p.x] &= this.regs[p.y]; }),
            '8XY3': (p) => __awaiter(this, void 0, void 0, function* () { this.regs[p.x] ^= this.regs[p.y]; }),
            '8XY4': (p) => __awaiter(this, void 0, void 0, function* () {
                this.vf = (this.regs[p.x] + this.regs[p.y]) > MAX_WORD ? 1 : 0;
                this.regs[p.x] = (this.regs[p.x] + this.regs[p.y]) & MAX_WORD;
            }),
            '8XY5': (p) => __awaiter(this, void 0, void 0, function* () {
                this.vf = (this.regs[p.x] - this.regs[p.y]) < 0 ? 0 : 1;
                this.regs[p.x] = (this.regs[p.x] - this.regs[p.y]) & MAX_WORD;
            }),
            '8XY6': (p) => __awaiter(this, void 0, void 0, function* () {
                this.vf = this.regs[p.x] & 1;
                this.regs[p.x] >>= 1;
            }),
            '8XY7': (p) => __awaiter(this, void 0, void 0, function* () {
                this.vf = (this.regs[p.y] - this.regs[p.x]) < 0 ? 0 : 1;
                this.regs[p.x] = (this.regs[p.y] - this.regs[p.x]) & MAX_WORD;
            }),
            '8XYE': (p) => __awaiter(this, void 0, void 0, function* () {
                this.vf = (this.regs[p.x] & 128) ? 1 : 0;
                this.regs[p.x] <<= 1;
            }),
            '9XY0': (p) => __awaiter(this, void 0, void 0, function* () { return (this.regs[p.x] != this.regs[p.y]) ? 2 : 1; }),
            'ANNN': (p) => __awaiter(this, void 0, void 0, function* () { this.i = p.addr; }),
            'BNNN': (p) => __awaiter(this, void 0, void 0, function* () { this.pc = (p.addr + this.regs[0]) & MAX_ADDR; }),
            'CXNN': (p) => __awaiter(this, void 0, void 0, function* () { this.regs[p.x] = (Math.random() * MAX_WORD + p.const8) & MAX_WORD; }),
            'DXYN': (p) => __awaiter(this, void 0, void 0, function* () { }),
            'EX9E': (p) => __awaiter(this, void 0, void 0, function* () { return (this.key === this.regs[p.x]) ? 2 : 1; }),
            'EXA1': (p) => __awaiter(this, void 0, void 0, function* () { return (this.key !== this.regs[p.x]) ? 2 : 1; }),
            'FX07': (p) => __awaiter(this, void 0, void 0, function* () { this.regs[p.x] = this.delay; }),
            'FX0A': (p) => __awaiter(this, void 0, void 0, function* () { this.regs[p.x] = yield this.getKey(); }),
            'FX15': (p) => __awaiter(this, void 0, void 0, function* () { this.delay = this.regs[p.x]; }),
            'FX18': (p) => __awaiter(this, void 0, void 0, function* () { this.beep = this.regs[p.x]; }),
            'FX1E': (p) => __awaiter(this, void 0, void 0, function* () { this.i = (this.i + this.regs[p.x]) & MAX_ADDR; }),
            'FX29': (p) => __awaiter(this, void 0, void 0, function* () { this.i = Math.max(this.regs[p.x] * 5, 15 * 5); }),
            'FX33': (p) => __awaiter(this, void 0, void 0, function* () {
                this.ram[this.i] = (this.regs[p.x] / 100 | 0) % 100;
                this.ram[this.i + 1] = (this.regs[p.x] / 10 | 0) % 10;
                this.ram[this.i + 2] = this.regs[p.x] % 10;
            }),
            'FX55': (p) => __awaiter(this, void 0, void 0, function* () {
                for (let i = 0; i <= p.x; i++)
                    this.ram[this.i + i] = this.regs[i];
            }),
            'FX65': (p) => __awaiter(this, void 0, void 0, function* () {
                for (let i = 0; i <= p.x; i++)
                    this.regs[i] = this.ram[this.i + i];
            })
        };
        this.canvas = canvas;
        // Clear ram
        for (let i = 0; i < 4096; i++)
            this.ram[i] = 0b10101010;
        // Insert rom
        for (let i = 0; i < rom.length; i++)
            this.ram[i] = rom[i];
        // Clear regs
        for (let i = 0; i < 0xf; i++)
            this.regs[i] = 0;
    }
    tick() {
        this.render();
    }
    parseIns(opcode) {
    }
    stackPush(data) {
    }
    stackPop(data) {
    }
    render() {
        let ctx = this.canvas.getContext('2d');
        for (let y = 0; y < 32; y++) {
            for (let x = 0; x < 64; x++) {
                let i = 0xF00 + Math.floor((y * 64 + x) / 8);
                let mask = 1 << (7 - (x % 8));
                let val = (this.ram[i] & mask) > 0 ? 255 : 0;
                let id = ctx.createImageData(1, 1); // only do this once per page
                let d = id.data; // only do this once per page
                d[0] = val;
                d[1] = val;
                d[2] = val;
                d[3] = 255;
                ctx.putImageData(id, x, y);
            }
        }
    }
    // Blocks until key is pressed, returns as ascii
    getKey() {
        // TODO implement
        return new Promise((resolve) => setTimeout(() => resolve(0), 1000));
    }
}
