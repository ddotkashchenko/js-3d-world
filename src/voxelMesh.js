import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshStandardMaterial,
    Vector3,
    EdgesGeometry,
    LineBasicMaterial,
    LineSegments
} from 'three';

export class VoxelMesh {
    #mesh;
    #options;

    constructor(options) {
        this.#options = { size: 1, position: new Vector3(), ...options };
        this.#initMesh();

        Object.defineProperty(this, 'mesh', {
            value: this.#mesh,
        });

        Object.defineProperty(this, 'name', {
            value: this.#mesh.name
        });
    }

    #initMesh() {
        const mesh = new Mesh(
            new BufferGeometry(),
            new MeshStandardMaterial({
                color: 0xaaaaff,
                flatShading: true,
                wireframe: true,
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

    async #construct(cells, size, maxLevel = 0) {
        const verticesGrouped = [];
        const indices = [];
        const verticesLookup = {};

        const offsetVertex =
            ([ox, oy, oz] = [0, 0, 0], level = 0) =>
            (x, y, z) => {
                const s = size * Math.pow(2, maxLevel - level);
                x *= s;
                y *= s;
                z *= s;

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

        const isBoundaryTop = ([cx, cy, cz]) => !cells[`${cx}.${cy + 1}.${cz}`];
        const isBoundaryBottom = ([cx, cy, cz]) => !cells[`${cx}.${cy - 1}.${cz}`];
        const isBoundaryLeft = ([cx, cy, cz]) => !cells[`${cx - 1}.${cy}.${cz}`];
        const isBoundaryRight = ([cx, cy, cz]) => !cells[`${cx + 1}.${cy}.${cz}`];
        const isBoundaryFront = ([cx, cy, cz]) => !cells[`${cx}.${cy}.${cz + 1}`];
        const isBoundaryBack = ([cx, cy, cz]) => !cells[`${cx}.${cy}.${cz - 1}`];

        let cellTasks = Object.values(cells).map(
            (cell) =>
                new Promise((resolve) =>
                    setTimeout(() => {
                        const cellPosition = Array.isArray(cell) ? cell : cell.position;
                        const level = !Array.isArray(cell) ? cell.level : 0;

                        const cellWithSize = cellPosition.map((c) => c * 2 * size);

                        const res = [
                            ...(isBoundaryTop(cellPosition)
                                ? top(offsetVertex(cellWithSize, level))
                                : []),
                            ...(isBoundaryBottom(cellPosition)
                                ? bottom(offsetVertex(cellWithSize, level))
                                : []),
                            ...(isBoundaryLeft(cellPosition)
                                ? left(offsetVertex(cellWithSize, level))
                                : []),
                            ...(isBoundaryRight(cellPosition)
                                ? right(offsetVertex(cellWithSize, level))
                                : []),
                            ...(isBoundaryFront(cellPosition)
                                ? front(offsetVertex(cellWithSize, level))
                                : []),
                            ...(isBoundaryBack(cellPosition)
                                ? back(offsetVertex(cellWithSize, level))
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
            this.#mesh.geometry.computeBoundingBox();
        });
    }

    #flatOctree(cell, level, cellsSide, [ox, oy, oz], cellsLookup) {
        if (cell.leaf || Math.pow(2, level) == cellsSide) {
            cellsLookup[`${ox}.${oy}.${oz}`] = {position: [ox, oy, oz], level}
        }
        else {
            cell.cells.forEach((c, i) => {
                if (c) {
                    const [ordX, ordY, ordZ] = octreeOrder[i];
                    const offset = cellsSide / Math.pow(2, level + 2);

                    this.#flatOctree(
                        c,
                        level + 1,
                        cellsSide,
                        [ox + (ordX * offset), oy + (ordY * offset), oz + (ordZ * offset)],
                        cellsLookup
                    )
                }
            });
        }
    }

    updateTop(level) {    
        console.log(`building ${level}`);
    
        const octree = this.#options.source(level, {rebuild: [0, 1, 0 ]});
        console.log(`build octree: `, octree);
        
        const cellsSide = Math.pow(2, level);
        const cellsObj = {}
        this.#flatOctree(octree, 0, cellsSide, [0, 0, 0], cellsObj);

        console.log(`flat octree: `, cellsObj);

        const voxelSize = this.#options.size / cellsSide;
        this.#construct(cellsObj, voxelSize, level).then((voxels) => {
            this.#mesh.geometry.setAttribute(
                'position',
                new BufferAttribute(new Float32Array(voxels.vertices), 3)
            );
            
            const positionAttribute = this.#mesh.geometry.getAttribute( 'position' );
            positionAttribute.needsUpdate = true;

            this.#mesh.geometry.setIndex(voxels.indices);
            this.#mesh.geometry.index.needsUpdate = true;

            this.#mesh.geometry.computeVertexNormals();
            this.#mesh.geometry.computeBoundingBox();
        });
    }

    constructOctree(level) {
        const cellsSide = Math.pow(2, level);
        const cellsObj = {}
        this.#flatOctree(this.#options.source(level), 0, cellsSide, [0, 0, 0], cellsObj);

        const size = this.#options.size / cellsSide;
        this.#construct(cellsObj, size).then((voxels) => {
            this.#mesh.geometry.setAttribute(
                'position',
                new BufferAttribute(new Float32Array(voxels.vertices), 3)
            );

            this.#mesh.geometry.setIndex(voxels.indices);
            this.#mesh.geometry.computeVertexNormals();
            this.#mesh.geometry.computeBoundingBox();
        });
    }
}

export const octreeOrder = [
    [-1, -1, -1],   [1, -1, -1], 
    [-1, -1, 1],    [1, -1, 1],
    [-1, 1, -1],    [1, 1, -1], 
    [-1, 1, 1],     [1, 1, 1]
];