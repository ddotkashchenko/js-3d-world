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
            get: () => this.#leaf,
            set: (v) => this.#leaf = v
        });

        Object.defineProperty(this, 'position', {
            get: () => this.#position
        });

        Object.defineProperty(this, 'parent', {
            value: this.#parent
        });
    }

    getAbsolutePosition() {
        const parents = [];
        let parent = this.parent;

        while(parent) {
            parents.push(parent);
            parent = parent.parent;
        }

        let level = 0;
        let [x, y, z] = [0, 0, 0];
        for(let i = parents.length - 1; i >= 0; i--) {
            const size = Math.pow(2, level);
            x += parents[i].position[0] / size;
            y += parents[i].position[1] / size;
            z += parents[i].position[2] / size;
            level++
        }

        return [x, y, z];
    }

    #cellIndexAt([x, y, z]) {
        return octreeOrder.findIndex(([ox, oy, oz]) => 
            x === ox && 
            y === oy && 
            z === oz);
    }

    traverse(relativePosition) {
        if(!this.#parent) {
            return null;
        }

        const findPosition = this.#position.map((p, i) => p + (2 * relativePosition[i]));
        const index = this.#cellIndexAt(findPosition);

        if(index === -1) {
            const adjacentParent = this.#parent.traverse(relativePosition);

            if(!adjacentParent) {
                return null;
            }

            if(adjacentParent.leaf) {
                return adjacentParent;
            }

            const flipPosition = findPosition.map((c) => c === -3 ? 1 : c === 3 ? -1 : c);
            const flipIndex = this.#cellIndexAt(flipPosition);

            return adjacentParent.cells[flipIndex];
        }

        return this.#parent.cells[index];
    }

    // set([x, y, z]) {
    //     this.#leaf = false;
    //     const index = this.#cellIndexAt([x, y, z]);
    //     const cell = new Octree([x, y, z], this);
    //     this.#cells[index] = cell;

    //     return cell;
    // }

    set([x, y, z]) {
        const index = this.#cellIndexAt([x, y, z]);
        let cell = this.#cells[index];

        if(!cell) {
            this.#leaf = false;
            cell = new Octree([x, y, z], this);
            this.#cells[index] = cell;
        }

        return cell;
    }
};

export const octreeOrder = [
    [-1, -1, -1],   [1, -1, -1], 
    [-1, -1, 1],    [1, -1, 1],
    [-1, 1, -1],    [1, 1, -1], 
    [-1, 1, 1],     [1, 1, 1]
];