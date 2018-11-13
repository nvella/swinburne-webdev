declare const rom: number[];

const MAX_WORD = 255;
const MAX_ADDR = (1 << 16) - 1;

interface OpParams {
    /**  addr: NNN */
    addr?: number,
    /** const8: NN */
    const8?: number,
    /** const4: N */
    const4?: number,
    /** x: register descriptor X */
    x?: number,
    /** y: register descriptor Y */
    y?: number
}

class Chip8 {
    canvas: HTMLCanvasElement;
    rom: string;
    
    ram: number[] = [];
    regs: number[] = [];
    vf = 0; // carry register
    i = 0; // address register
    pc = 0; // program counter 
    
    key = 0; // current key pressed
    delay = 0; // delay timer
    beep = 0; // beep timer

    constructor(canvas, program) {
        this.canvas = canvas;

        // Clear ram
        for(let i = 0; i < 4096; i++) this.ram[i] = 0b10101010;
        // Insert rom
        for(let i = 0; i < rom.length; i++) this.ram[i] = rom[i];
        // Clear regs
        for(let i = 0; i < 0xf; i++) this.regs[i] = 0;
    }

    tick() {
        this.render();
    }

    parseIns(opcode) {
        
    }

    opcodes: {[opcode: string]: (p?: OpParams) => Promise<number | void>} = {

        '0NNN': async ()  => {},
        '00E0': async ()  => { for(let i = 0xf00; i <= 0xfff; i++) this.ram[i] = 0; }, // clear display
        '00EE': async ()  => { /* TODO do stack shit */ },
        '1NNN': async (p) => { this.pc = p.addr; return 0; },
        '2NNN': async (p) => { /* TODO stack */ },
        '3XNN': async (p) => { if(this.regs[p.x] === p.const8) return 2; },
        '4XNN': async (p) => { if(this.regs[p.x] !== p.const8) return 2; },
        '5XY0': async (p) => { if(this.regs[p.x] !== this.regs[p.y]) return 2; },

        '6XNN': async (p) => { this.regs[p.x] = p.const8; },
        '7XNN': async (p) => { // Handle add const8 with carry
            this.vf = (this.regs[p.x] + p.const8) > MAX_WORD ? 1 : 0;
            this.regs[p.x] = (this.regs[p.x] + p.const8) & MAX_WORD; 
        },

        '8XY0': async (p) => { this.regs[p.x] = this.regs[p.y]; },
        '8XY1': async (p) => { this.regs[p.x] |= this.regs[p.y]; },
        '8XY2': async (p) => { this.regs[p.x] &= this.regs[p.y]; },
        '8XY3': async (p) => { this.regs[p.x] ^= this.regs[p.y]; },

        '8XY4': async (p) => { // Handle add with carry
            this.vf = (this.regs[p.x] + this.regs[p.y]) > MAX_WORD ? 1 : 0;
            this.regs[p.x] = (this.regs[p.x] + this.regs[p.y]) & MAX_WORD; 
        },
        '8XY5': async (p) => { // Handle sub with carry
            this.vf = (this.regs[p.x] - this.regs[p.y]) < 0 ? 0 : 1;
            this.regs[p.x] = (this.regs[p.x] - this.regs[p.y]) & MAX_WORD; 
        },
        '8XY6': async (p) => { // store LSB in VF and shift right by one
            this.vf = this.regs[p.x] & 1;
            this.regs[p.x] >>= 1; 
        },
        '8XY7': async (p) => { // Handle sub with carry
            this.vf = (this.regs[p.y] - this.regs[p.x]) < 0 ? 0 : 1;
            this.regs[p.x] = (this.regs[p.y] - this.regs[p.x]) & MAX_WORD; 
        },
        '8XYE': async (p) => { // Store MSB in VF and shift left by one
            this.vf = (this.regs[p.x] & 128) ? 1 : 0;
            this.regs[p.x] <<= 1; 
        },

        '9XY0': async (p) => (this.regs[p.x] != this.regs[p.y]) ? 2 : 1,
        'ANNN': async (p) => { this.i = p.addr; },
        'BNNN': async (p) => { this.pc = (p.addr + this.regs[0]) & MAX_ADDR; },
        'CXNN': async (p) => { this.regs[p.x] = (Math.random() * MAX_WORD + p.const8) & MAX_WORD; },
        
        'DXYN': async (p) => { /* draw sprite */ },
        
        'EX9E': async (p) => (this.key === this.regs[p.x]) ? 2 : 1,
        'EXA1': async (p) => (this.key !== this.regs[p.x]) ? 2 : 1,

        'FX07': async (p) => { this.regs[p.x] = this.delay; }, 
        'FX0A': async (p) => { this.regs[p.x] = await this.getKey(); },
        'FX15': async (p) => { this.delay = this.regs[p.x]; },
        'FX18': async (p) => { this.beep = this.regs[p.x]; },

        'FX1E': async (p) => { this.i = (this.i + this.regs[p.x]) & MAX_ADDR; },
        'FX29': async (p) => { this.i = Math.max(this.regs[p.x] * 5, 15*5); },
        
        'FX33': async (p) => { // Binary coded decimal
            this.ram[this.i]     = (this.regs[p.x] / 100 | 0) % 100;
            this.ram[this.i + 1] = (this.regs[p.x] / 10 | 0)  % 10;
            this.ram[this.i + 2] =  this.regs[p.x]            % 10;
        },

        'FX55': async (p) => { // Reg dump
            for(let i = 0; i <= p.x; i++) this.ram[this.i + i] = this.regs[i];
        },
        'FX65': async (p) => { // Reg load
            for(let i = 0; i <= p.x; i++) this.regs[i] = this.ram[this.i + i];
        }
     }

    stackPush(data) {

    }

    stackPop(data) {
        
    }
  
    render() {
        let ctx = this.canvas.getContext('2d');

        for(let y = 0; y < 32; y++) {
            for(let x = 0; x < 64; x++) {
                let i = 0xF00 + Math.floor((y * 64 + x) / 8);
                let mask = 1 << (7 - (x % 8));

                let val = (this.ram[i] & mask) > 0 ? 255 : 0;

                let id = ctx.createImageData(1,1); // only do this once per page
                let d  = id.data;                        // only do this once per page
                d[0]   = val;
                d[1]   = val;
                d[2]   = val;
                d[3]   = 255;
                ctx.putImageData( id, x, y );     
            }
        }
    }

    // Blocks until key is pressed, returns as ascii
    getKey(): Promise<number> {
        // TODO implement
        return new Promise<number>((resolve) => setTimeout(() => resolve(0), 1000));
    }
}