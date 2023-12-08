import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshStandardMaterial,
} from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { Octree } from '../octree';

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
                wireframe: false,
            })
        );
        this.#mesh.name = name;
        this.#mesh.position.set(...position);
        this.#mesh.scale.set(SCALE, SCALE, SCALE);

        Object.defineProperty(this, 'mesh', {
            value: this.#mesh,
        });

        Object.defineProperty(this, 'name', {
            value: this.#mesh.name,
        });
    }

    #draw(root, level, maxLevel, offset = [0, 0, 0], bag) {
        if (root.leaf || level === maxLevel) {
            const halfSide = 1 / (2 * Math.pow(2, level));
            const [ox, oy, oz] = offset;
            const [rx, ry, rz] = root.position;

            for (const { normal, vertices } of box) {
                if (root.isBoundary(normal)) {
                    for (const [tx, ty, tz] of vertices) {
                        const x = (tx + rx) * halfSide + ox;
                        const y = (ty + ry) * halfSide + oy;
                        const z = (tz + rz) * halfSide + oz;

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
                cell &&
                    this.#draw(cell, level + 1, maxLevel, root.position, bag);
            }
        }
    }

    draw(level = 0) {
        const bag = { vertices: [], indices: [], indexLookup: {} };
        this.#draw(this.#octree, 0, level, [0, 0, 0], bag);

        this.#mesh.geometry.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(bag.vertices.flat()), 3)
        );

        this.#mesh.geometry.setIndex(bag.indices);

        this.#mesh.geometry.computeBoundingBox();
        this.#mesh.geometry.computeBoundingSphere();
        this.#mesh.geometry.computeVertexNormals();
    }
}
