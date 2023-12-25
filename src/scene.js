import {
    MeshStandardMaterial,
    PlaneGeometry,
    BoxGeometry,
    Mesh,
    Vector3,
} from 'three';
import { octreeOrder } from '../octree';

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

export {
    makePlane,
    makeCube,
    makeWater,
    octreeSphereNew
};
