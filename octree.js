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

        Object.defineProperty(this, 'parent', {
            value: this.#parent
        });
    }

    #cellIndexAt([x, y, z]) {
        return octreeOrder.findIndex(([ox, oy, oz]) => 
            x === ox && 
            y === oy && 
            z === oz);
    }

    find(relativePosition) {
        if(!this.#parent) {
            return null;
        }

        // questionable
        if(this.#parent.leaf) {
            return this.#parent;
        }

        const findPosition = this.#position.map((p, i) => p + (2 * relativePosition[i]));
        const index = this.#cellIndexAt(findPosition);

        if(index === -1) {
            const adjacentParent = this.#parent.find(relativePosition);
            if(!adjacentParent) {
                return null;
            }

            const flipPosition = findPosition.map((c) => c === -3 ? 1 : c === 3 ? -1 : c);
            const flipIndex = this.#cellIndexAt(flipPosition);
            return adjacentParent.cells[flipIndex];
        }

        return this.#parent.cells[index];
    }

    set([x, y, z]) {
        this.#leaf = false;
        const index = this.#cellIndexAt([x, y, z]);
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