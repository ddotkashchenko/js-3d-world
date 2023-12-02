import {
    MeshStandardMaterial,
    PlaneGeometry,
    BoxGeometry,
    Mesh,
    Vector3,
} from 'three';
import VoxelMesh from './voxelMesh';

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

function makeOctreePyramid(position) {
    // const shape = {
    //     cells: [1, 1, 1, 1, 1, 1, 1, null], //.map(c => Boolean(c))
    // };

    const shape = {
        cells: [
            {cells: [1, 1, 1, 1, 1, 1, 1, null]},
            {cells: [1, 1, 1, 1, 1, 1, 1, null]},
            {cells: [1, 1, 1, 1, 1, 1, 1, null]},
            {cells: [1, 1, 1, 1, 1, 1, 1, null]},
            {cells: [1, 1, 1, 1, 1, 1, 1, null]},
            {cells: [1, 1, 1, 1, 1, 1, 1, null]},
            {cells: [1, 1, 1, 1, 1, 1, 1, null]},
            null,
            null
        ],
    };

    const pyramid = new VoxelMesh({
        size: 32,
        name: 'octree-pyramid',
        position,
        material: {
            color: 0x44bbbb,
            wireframe: false,
        },
    });

    pyramid.constructOctree(shape, 2);
    return pyramid.mesh;
}

export { makePlane, makeCube, makePyramid, makeOctreePyramid };
