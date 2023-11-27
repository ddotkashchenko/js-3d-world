import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshPhongMaterial,
} from 'three';

export default class VoxelTerrain {
    constructor(size) {
        this._size = size;
        this._resolution = 1;

        this._cells = [];
    }

    _construct(cells) {

        const verticesGrouped = [];

        const vertexAt = (offset) => (x, y, z) => {
            const { ox, oy, oz } = { ...{ ox: 0, oy: 0, oz: 0 }, ...offset };
            const index = verticesGrouped.findIndex(
                ([vx, vy, vz]) => x + ox === vx && y + oy === vy && z + oz == vz
            );
            return index === -1
                ? verticesGrouped.push([x + ox, y + oy, z + oz]) - 1
                : index;
        };

        // prettier-ignore
        const front = (vAt = vertexAt()) => [
            vAt(-1, -1, 1), vAt(1, -1, 1), vAt(1, 1, 1),
            vAt(-1, -1, 1), vAt(1, 1, 1), vAt(-1, 1, 1)
        ];
        // prettier-ignore
        const top = (vAt = vertexAt()) => [
            vAt(1, 1, 1), vAt(1, 1, -1), vAt(-1, 1, -1),
            vAt(-1, 1, 1), vAt(1, 1, 1), vAt(-1, 1, -1)
        ];
        // prettier-ignore
        const bottom = (vAt = vertexAt()) => [
            vAt(1, -1, -1), vAt(1, -1, 1), vAt(-1, -1, 1), 
            vAt(-1, -1, -1), vAt(1, -1, -1), vAt(-1, -1, 1), 
        ];
        // prettier-ignore
        const left = (vAt = vertexAt()) => [
            vAt(-1, 1, -1), vAt(-1, -1, -1), vAt(-1, -1, 1), 
            vAt(-1, 1, -1), vAt(-1, -1, 1), vAt(-1, 1, 1), 
        ];
        // prettier-ignore
        const right = (vAt = vertexAt()) => [
            vAt(1, -1, 1), vAt(1, -1, -1), vAt(1, 1, -1), 
            vAt(1, 1, 1), vAt(1, -1, 1), vAt(1, 1, -1), 
        ];
        // prettier-ignore
        const back = (vAt = vertexAt()) => [
            vAt(1, 1, -1), vAt(1, -1, -1), vAt(-1, -1, -1),
            vAt(-1, 1, -1), vAt(1, 1, -1), vAt(-1, -1, -1)
        ];

        const forward2 = vertexAt({oz: 2,});
        const forward4 = vertexAt({oz: 4,});
        const forward4left2 = vertexAt({ox: 2, oz: 4});
        const up = vertexAt({oy: 2});

        const indices = [
            ...back(),

            ...bottom(), 
            ...left(), ...right(), 
            
            ...top(forward2), ...bottom(forward2), 
            ...left(forward2), ...right(forward2),

            ...top(forward4), ...bottom(forward4), 
            ...left(forward4), 
            
            ...top(forward4left2), ...bottom(forward4left2),
            ...front(forward4left2), ...back(forward4left2),
            ...right(forward4left2),

            ...front(up), ...back(up), ...left(up), ...right(up), ...top(up),

            ...front(forward4),
        ];

        return {
            vertices: verticesGrouped.flat(),
            indices,
        };
    }

    view() {
        const voxels = this._construct();

        const geometry = new BufferGeometry();
        geometry.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(voxels.vertices), 3)
        );

        geometry.setIndex(voxels.indices);

        const mesh = new Mesh(
            geometry,
            new MeshPhongMaterial({
                color: 0xaaaaff,
                flatShading: true,
                wireframe: true,
            })
        );
        mesh.name = 'terrain';
        mesh.position.set(0, 50, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }
}
