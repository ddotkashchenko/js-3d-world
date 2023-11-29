import {
    MeshStandardMaterial,
    PlaneGeometry,
    BoxGeometry,
    Mesh,
    Vector3,
} from 'three';
import VoxelMesh from './voxelMesh';

function makePlane(size, segments) {
    const plane = new Mesh(
        new PlaneGeometry(size, size, segments, segments),
        new MeshStandardMaterial({ color: 0xbce791 })
    );
    plane.rotateX(-Math.PI / 2);
    plane.castShadow = true;
    plane.receiveShadow = true;

    return plane;
}

function makeCube(size) {
    const cube = new Mesh(
        new BoxGeometry(size, size, size, 1, 1, 1),
        new MeshStandardMaterial({ color: 0xff5555 })
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
        material
    });

    pyramid.construct(pyramidShape);

    return pyramid.mesh;
}

export { makePlane, makeCube, makePyramid };
