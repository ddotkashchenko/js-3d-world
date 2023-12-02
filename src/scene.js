import {
    MeshStandardMaterial,
    PlaneGeometry,
    BoxGeometry,
    Mesh,
    Vector3,
} from 'three';
import { VoxelMesh, octreeOrder } from './voxelMesh';

function makePlane(options) {
    const { width, height, segments, material, shadow } = {
        width: 10,
        height: 10,
        segments: 1,
        material: { color: 0xbce791 },
        shadow: false,
        ...options,
    };
    const plane = new Mesh(
        new PlaneGeometry(width, height, segments, segments),
        new MeshStandardMaterial(material)
    );
    plane.rotateX(-Math.PI / 2);
    plane.castShadow = shadow;
    plane.receiveShadow = shadow;

    return plane;
}

function makeCube(size) {
    const cube = new Mesh(
        new BoxGeometry(size, size, size, 1, 1, 1),
        new MeshStandardMaterial({ color: 0xff5555, wireframe: false })
    );

    cube.castShadow = true;
    cube.receiveShadow = true;

    return cube;
}

function makePyramid(height, size, position, material) {
    const pyramidShape = [...Array(height).keys()]
        .map((y) => {
            const res = [];
            const width = height - 1 - y;
            for (var x = -width; x <= width; x++)
                for (var z = -width; z <= width; z++) {
                    if (y !== 1 || z !== 0) res.push([x, y, z]);
                }

            return res;
        })
        .flat();

    const pyramid = new VoxelMesh({
        size: size,
        name: 'pyramid',
        position,
        material,
    });

    pyramid.construct(pyramidShape);

    return pyramid.mesh;
}

function makeWater(width, height, heightLevel, material) {
    const mesh = new Mesh(
        new PlaneGeometry(width, height, 1, 1),
        new MeshStandardMaterial({
            color: 0x1da2d8,
            ...material
        })
    );
    mesh.rotateX(-Math.PI / 2);
    mesh.position.setComponent(1, heightLevel);

    return mesh;
}

function makeSphere(radius, level, maxLevel, [offsetX, offsetY, offsetZ]) {
    if (level == maxLevel) {
        return 1;
    }

    return {
        cells: octreeOrder.map(([signX, signY, signZ]) => {
            const pow = Math.pow(2, level);
            const v = new Vector3(
                offsetX + signX / pow,
                offsetY + signY / pow,
                offsetZ + signZ / pow
            );

            return v.length() >= radius + (radius * 0.7 / pow)
                ? null
                : makeSphere(radius, level + 1, maxLevel, v);
        }),
    };
}

function makeOctreeSphere(position) {

    const res = 8;

    const shape = makeSphere(1.66, 0, res, [0, 0, 0]);

    const sphere = new VoxelMesh({
        size: 32,
        name: 'octree-pyramid',
        position,
        material: {
            color: 0x44bbbb,
            wireframe: false,
        },
    });
    sphere.constructOctree(shape, res - 1);
    return sphere.mesh;
}

function makeOctreePyramid(position) {

    let shape = {
        cells: [
            { cells: [1, 1, 1, 1, null, null, null, 1] },
            { cells: [1, 1, 1, 1, null, null, 1, null] },
            { cells: [1, 1, 1, 1, null, 1, null, null] },
            { cells: [1, 1, 1, 1, 1, null, 1, null] },

            { cells: [null, null, null, 1, null, null, null, null] },
            { cells: [null, null, 1, null, null, null, null] },
            { cells: [null, 1, null, null, null, null, null] },
            { cells: [1, null, null, null, null, null, null] },
        ],
    };

    shape = {
        cells: Array(8).fill(shape),
    };

    const pyramid = new VoxelMesh({
        size: 16,
        name: 'octree-pyramid',
        position,
        material: {
            color: 0x22aa22,
            wireframe: false,
        },
    });

    pyramid.constructOctree(shape, 3);
    return pyramid.mesh;
}

export {
    makePlane,
    makeCube,
    makePyramid,
    makeOctreePyramid,
    makeOctreeSphere,
    makeWater
};
