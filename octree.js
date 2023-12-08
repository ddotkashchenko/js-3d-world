export class Octree {
    #parent
    #cells;
    #leaf;
    #position;

    constructor(position = [0, 0, 0], parent = null) {
        this.#parent = parent;
        this.#cells = [...new Array(8)].map(() => null);
        this.#position = position;
        this.#leaf = true;

        Object.defineProperty(this, 'cells', {
            value: this.#cells
        });

        Object.defineProperty(this, 'leaf', {
            get: () => this.#leaf
        });

        Object.defineProperty(this, 'position', {
            value: this.#position
        });
    }

    isBoundary([nx, ny, nz]) {
        if(!this.#parent) {
            return true;
        }

        const [px, py, pz] = this.#position;
        const x = nx ? (px + nx) || -px : px;
        const y = ny ? (py + ny) || -py : py;
        const z = nz ? (pz + nz) || -pz : pz;

        const index = octreeOrder.findIndex(([ox, oy, oz]) => 
            x === ox && 
            y === oy && 
            z === oz);

        return !this.#parent.cells[index];
    }

    set([x, y, z]) {
        this.#leaf = false;
        const index = octreeOrder.findIndex(([ox, oy, oz]) => 
            x === ox && 
            y === oy && 
            z === oz);
        const cell = new Octree([x, y, z], this);
        this.#cells[index] = cell;

        return cell;
    }
};

export const octreeOrder = [
    [-1, -1, -1],   [1, -1, -1], 
    [-1, -1, 1],    [1, -1, 1],
    [-1, 1, -1],    [1, 1, -1], 
    [-1, 1, 1],     [1, 1, 1]
];