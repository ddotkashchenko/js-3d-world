import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshStandardMaterial,
    Vector3,
} from 'three';

export default class VoxelMesh {
    #mesh;
    #options;

    constructor(options) {
        this.#options = { size: 1, position: new Vector3(), ...options };
        this.#initMesh();

        Object.defineProperty(this, 'mesh', {
            value: this.#mesh,
        });
    }

    #initMesh() {
        const mesh = new Mesh(
            new BufferGeometry(),
            new MeshStandardMaterial({
                color: 0xaaaaff,
                flatShading: true,
                wireframe: false,
                ...this.#options.material,
            })
        );
        mesh.name = this.#options.name;
        mesh.position.set(
            this.#options.position.x,
            this.#options.position.y,
            this.#options.position.z
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;

        this.#mesh = mesh;
    }

    async #construct(cells, size) {
        const verticesGrouped = [];
        const indices = [];
        const verticesLookup = {};

        const offsetVertex =
            ([ox, oy, oz] = [0, 0, 0]) =>
            (x, y, z) => {
                x *= size;
                y *= size;
                z *= size;

                const key = `${x + ox}.${y + oy}.${z + oz}`;
                let index = verticesLookup[key];

                if (index) {
                    return index;
                }

                index = verticesGrouped.push([x + ox, y + oy, z + oz]) - 1;
                verticesLookup[key] = index;

                return index;
            };

        // prettier-ignore
        const front = (v = offsetVertex()) => [
            v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1),
            v(-1, -1, 1), v(1, 1, 1), v(-1, 1, 1)
        ];
        // prettier-ignore
        const top = (v = offsetVertex()) => [
            v(1, 1, 1), v(1, 1, -1), v(-1, 1, -1),
            v(-1, 1, 1), v(1, 1, 1), v(-1, 1, -1)
        ];
        // prettier-ignore
        const bottom = (v = offsetVertex()) => [
            v(1, -1, -1), v(1, -1, 1), v(-1, -1, 1), 
            v(-1, -1, -1), v(1, -1, -1), v(-1, -1, 1), 
        ];
        // prettier-ignore
        const left = (v = offsetVertex()) => [
            v(-1, 1, -1), v(-1, -1, -1), v(-1, -1, 1), 
            v(-1, 1, -1), v(-1, -1, 1), v(-1, 1, 1), 
        ];
        // prettier-ignore
        const right = (v = offsetVertex()) => [
            v(1, -1, 1), v(1, -1, -1), v(1, 1, -1), 
            v(1, 1, 1), v(1, -1, 1), v(1, 1, -1), 
        ];
        // prettier-ignore
        const back = (v = offsetVertex()) => [
            v(1, 1, -1), v(1, -1, -1), v(-1, -1, -1),
            v(-1, 1, -1), v(1, 1, -1), v(-1, -1, -1)
        ];

        const isBoundaryTop = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx === vx && cy + 1 === vy && cz === vz
            );
        const isBoundaryBottom = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx === vx && cy - 1 === vy && cz === vz
            );
        const isBoundaryLeft = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx - 1 === vx && cy === vy && cz === vz
            );
        const isBoundaryRight = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx + 1 === vx && cy === vy && cz === vz
            );
        const isBoundaryFront = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx === vx && cy === vy && cz + 1 === vz
            );
        const isBoundaryBack = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx === vx && cy === vy && cz - 1 === vz
            );

        let cellTasks = cells.map(
            (cell) =>
                new Promise((resolve) =>
                    setTimeout(() => {
                        const cellWithSize = cell.map((c) => c * 2 * size); //this.#options.size);
                        const res = [
                            ...(isBoundaryTop(cell)
                                ? top(offsetVertex(cellWithSize))
                                : []),
                            ...(isBoundaryBottom(cell)
                                ? bottom(offsetVertex(cellWithSize))
                                : []),
                            ...(isBoundaryLeft(cell)
                                ? left(offsetVertex(cellWithSize))
                                : []),
                            ...(isBoundaryRight(cell)
                                ? right(offsetVertex(cellWithSize))
                                : []),
                            ...(isBoundaryFront(cell)
                                ? front(offsetVertex(cellWithSize))
                                : []),
                            ...(isBoundaryBack(cell)
                                ? back(offsetVertex(cellWithSize))
                                : []),
                        ];
                        resolve(res);
                    }, 0)
                )
        );

        for (const task of cellTasks) {
            indices.push(await task);
        }

        return {
            vertices: verticesGrouped.flat(),
            indices: indices.flat(),
        };
    }

    construct(cells) {
        this.#construct(cells, this.#options.size).then((voxels) => {
            this.#mesh.geometry.setAttribute(
                'position',
                new BufferAttribute(new Float32Array(voxels.vertices), 3)
            );

            this.#mesh.geometry.setIndex(voxels.indices);
            this.#mesh.geometry.computeVertexNormals();
        });
    }

    // prettier-ignore
    #octreeOrder = [
        [-1, -1, -1],   [1, -1, -1], 
        [-1, -1, 1],    [1, -1, 1],
        [-1, 1, -1],    [1, 1, -1], 
        [-1, 1, 1],     [1, 1, 1]
    ];

    #octree(cell, level, cellsSide, [ox, oy, oz] = [0, 0, 0]) {
        if (Math.pow(2, level) == cellsSide) {
            return [[ox, oy, oz]];
        }

        const res = [];
        cell.cells.forEach((c, i) => {
            if (c) {
                const [ordX, ordY, ordZ] = this.#octreeOrder[i];
                const offset = cellsSide / Math.pow(2, level + 2);
                res.push(
                    this.#octree(
                        c,
                        level + 1,
                        cellsSide,
                        [ox + (ordX * offset), oy + (ordY * offset), oz + (ordZ * offset)]
                    )
                );
            }
        });

        return res.flat();
    }

    constructOctree(cell, level) {
        const cellsSide = Math.pow(2, level);
        const cells = this.#octree(cell, 0, cellsSide);

        const size = this.#options.size / cellsSide;
        this.#construct(cells, size).then((voxels) => {
            this.#mesh.geometry.setAttribute(
                'position',
                new BufferAttribute(new Float32Array(voxels.vertices), 3)
            );

            this.#mesh.geometry.setIndex(voxels.indices);
            this.#mesh.geometry.computeVertexNormals();
        });
    }
}
