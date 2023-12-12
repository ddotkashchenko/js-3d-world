import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshPhongMaterial,
    MeshStandardMaterial,
} from 'three';

const SCALE = 50;

// prettier-ignore
const front = { 
    normal: [0, 0, 1], 
    vertices: [
    [-1, -1, 1], [1, -1, 1], [1, 1, 1],
    [-1, -1, 1], [1, 1, 1], [-1, 1, 1]
]};
// prettier-ignore
const top = {
    normal: [0, 1, 0],
    vertices: [
    [1, 1, 1], [1, 1, -1], [-1, 1, -1],
    [-1, 1, 1], [1, 1, 1], [-1, 1, -1]
]};
// prettier-ignore
const bottom = {
    normal: [0, -1, 0],
    vertices: [
    [1, -1, -1], [1, -1, 1], [-1, -1, 1], 
    [-1, -1, -1], [1, -1, -1], [-1, -1, 1], 
]};
// prettier-ignore
const left = {
    normal: [-1, 0, 0],
    vertices: [
    [-1, 1, -1], [-1, -1, -1], [-1, -1, 1], 
    [-1, 1, -1], [-1, -1, 1], [-1, 1, 1], 
]};
// prettier-ignore
const right = {
    normal: [1, 0, 0],
    vertices: [
    [1, -1, 1], [1, -1, -1], [1, 1, -1], 
    [1, 1, 1], [1, -1, 1], [1, 1, -1], 
]};
// prettier-ignore
const back = {
    normal: [0, 0, -1],
    vertices: [
    [1, 1, -1], [1, -1, -1], [-1, -1, -1],
    [-1, 1, -1], [1, 1, -1], [-1, -1, -1]
]};

const box = [front, back, top, bottom, left, right];

export default class OctreeDebugMesh {
    #octree;
    #mesh;

    constructor(octree, position, name) {
        this.#octree = octree;
        this.#mesh = new Mesh(
            new BufferGeometry(),
            new MeshStandardMaterial({
                color: 0xff99ff,
                flatShading: true,
            })
        );

        this.#mesh.castShadow = true;
        this.#mesh.receiveShadow = true;

        this.#mesh.name = name;
        this.#mesh.position.set(...position);
        this.#mesh.scale.set(SCALE, SCALE, SCALE);

        Object.defineProperty(this, 'shape', {
            value: this.#octree
        });
        
        Object.defineProperty(this, 'mesh', {
            value: this.#mesh,
        });

        Object.defineProperty(this, 'name', {
            value: this.#mesh.name,
        });
    }

    #draw(root, level, maxLevel, offset = [0, 0, 0], bag) {
        const halfSide = 1 / (2 * Math.pow(2, level));
        if (root.leaf || level === maxLevel) {
            const [ox, oy, oz] = offset;

            for (const { normal, vertices } of box) {
                if(!root.find(normal)) {
                    for (const [tx, ty, tz] of vertices) {
                        const x = (tx) * 2 * halfSide + ox;
                        const y = (ty) * 2 * halfSide + oy;
                        const z = (tz) * 2 * halfSide + oz;

                        let index = bag.indexLookup[`${x}.${y}.${z}`];
                        if (index === undefined) {
                            index = bag.vertices.push([x, y, z]) - 1;
                            bag.indexLookup[`${x}.${y}.${z}`] = index;
                        }
                        bag.indices.push(index);
                    }
                }
            }
        } else {
            for (const cell of root.cells) {
                if(cell) {
                    const [cpx, cpy, cpz] = cell.position;
                    const [rpx, rpy, rpz] = offset;
                    const newOffset = [cpx * halfSide + rpx, cpy * halfSide + rpy, cpz * halfSide + rpz];
                    cell &&
                        this.#draw(cell, level + 1, maxLevel, newOffset, bag);
                }
            }
        }
    }

    draw(level = 0) {
        console.log('building ', level);
        const bag = { vertices: [], indices: [], indexLookup: {} };
        this.#draw(this.#octree, 0, level, [0, 0, 0], bag);

        this.#mesh.geometry.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(bag.vertices.flat()), 3)
        );

        this.#mesh.geometry.setIndex(bag.indices);
        
        this.#mesh.geometry.computeVertexNormals();
        this.#mesh.geometry.computeBoundingBox();
        this.#mesh.geometry.computeBoundingSphere();
        this.#mesh.material.needsUpdate = true;
    }
}
