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
        const front = (offset) => {
            const vAt = vertexAt(offset);
            return [
                vAt(-1, -1, 1), vAt(1, -1, 1), vAt(1, 1, 1),
                vAt(-1, -1, 1), vAt(1, 1, 1), vAt(-1, 1, 1)
            ]
        };
        // prettier-ignore
        const top = (offset) => {
            const vAt = vertexAt(offset);
            return [
                vAt(1, 1, 1), vAt(1, 1, -1), vAt(-1, 1, -1),
                vAt(-1, 1, 1), vAt(1, 1, 1), vAt(-1, 1, -1)
            ];
        };
        // prettier-ignore
        const bottom = (offset) => {
            const vAt = vertexAt(offset);
            return [
                vAt(1, -1, -1), vAt(1, -1, 1), vAt(-1, -1, 1), 
                vAt(-1, -1, -1), vAt(1, -1, -1), vAt(-1, -1, 1), 
            ];
        };
        // prettier-ignore
        const left = (offset) => {
            const vAt = vertexAt(offset);
            return [
                vAt(-1, 1, -1), vAt(-1, -1, -1), vAt(-1, -1, 1), 
                vAt(-1, 1, -1), vAt(-1, -1, 1), vAt(-1, 1, 1), 
            ];
        };
        // prettier-ignore
        const right = (offset) => {
            const vAt = vertexAt(offset);
            return [
                vAt(1, -1, 1), vAt(1, -1, -1), vAt(1, 1, -1), 
                vAt(1, 1, 1), vAt(1, -1, 1), vAt(1, 1, -1), 
            ];
        };
        // prettier-ignore
        const back = (offset) => {
            const vAt = vertexAt(offset);
            return [
                vAt(1, 1, -1), vAt(1, -1, -1), vAt(-1, -1, -1),
                vAt(-1, 1, -1), vAt(1, 1, -1), vAt(-1, -1, -1)
            ]
        };

        const rightFour = {ox: 4};

        const indices = [
            ...front(), ...top(), ...bottom(), 
            ...left(), ...right(), ...back(),

            ...front(rightFour), ...top(rightFour), ...bottom(rightFour), 
            ...left(rightFour), ...right(rightFour), ...back(rightFour),
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
                wireframe: false,
            })
        );
        mesh.name = 'terrain';
        mesh.position.set(0, 50, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }
}
