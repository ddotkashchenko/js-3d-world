import {
    MeshStandardMaterial,
    PlaneGeometry,
    BoxGeometry,
    Mesh,
    Vector3,
} from 'three';
import { VoxelMesh, octreeOrder } from './voxelMesh';
import { Octree } from '../octree';

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

function makeCube(options) {
    const { size, name, position, material } = {
        size: 2,
        name: 'cube',
        position: new Vector3(-100, 70, 0),
        material: { color: 0xff5555, wireframe: false },
        ...options,
    };

    const cube = new Mesh(
        new BoxGeometry(size, size, size, 1, 1, 1),
        new MeshStandardMaterial(material)
    );
    cube.name = name;
    cube.position.set(position.x, position.y, position.z),
        (cube.castShadow = true);
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
            ...material,
        })
    );
    mesh.rotateX(-Math.PI / 2);
    mesh.position.setComponent(1, heightLevel);

    return mesh;
}

// function testOctree() {
//     const root = new Octree();

//     root.set([1, 1, 1]);
//     root.set([1, -1, 1]);
//     root.set([-1, -1, 1]);
//     root.set([1, -1, -1]);

//     return root;
// }

function octreeSphereNew(root, maxLevel, radius = 1.666, level = 0, [ox, oy, oz] = [0, 0, 0]) {
    if(maxLevel === level) {
        return;
    }

    const pow = Math.pow(2, level);

    for(const [cx, cy, cz] of octreeOrder) {
        const v = new Vector3(
            ox + (cx / pow),
            oy + (cy / pow),
            oz + (cz / pow)
        );
        
        const inside = v.length() <= radius + (radius * 0.7) / pow;

        if(inside) {
            const cell = root.set([cx, cy, cz]);
            octreeSphereNew(cell, maxLevel, radius, level + 1, [v.x, v.y, v.z]); 
        }
    }
}

function calcSphere(
    radius,
    level,
    maxLevel,
    options,
    [offsetX, offsetY, offsetZ] = [0, 0, 0]
) {
    if (level == maxLevel) {
        return { leaf: true };
    }

    return {
        cells: octreeOrder.map(([signX, signY, signZ]) => {
            const pow = Math.pow(2, level);
            const v = new Vector3(
                offsetX + signX / pow,
                offsetY + signY / pow,
                offsetZ + signZ / pow
            );

            const insideSphere = v.length() <= radius + (radius * 0.7) / pow;
            const continueRebuild = level > 0 || !options || signY === options.rebuild[1];
            
            return !continueRebuild
                ? {leaf: true}
                : insideSphere
                ? calcSphere(radius, level + 1, maxLevel, options, v)
                : null;
        }),
    };
}

function makeOctreeSphere(options) {
    const { radius, name, res, size, position, material } = {
        radius: 1.666,
        name: 'sphere',
        res: 3,
        position: new Vector3(),
        size: 32,
        material: {
            color: 0x44bbbb,
            wireframe: false,
        },
        ...options,
    };

    const sphere = new VoxelMesh({
        size,
        name,
        position,
        material,
        source: (res, ro) => calcSphere(radius, 0, res, ro),
    });
    sphere.constructOctree(Math.max(0, res));
    return sphere;
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
    makeWater,
    octreeSphereNew
};
