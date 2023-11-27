import {
    BoxGeometry,
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshPhongMaterial,
    MeshStandardMaterial,
    Vector3,
} from 'three';

export default class VoxelTerrain {
    constructor(size) {
        this._size = size;
        this._resolution = 1;

        this._cells = [];
    }

    _construct(cells) {
        const wall = (offset = 0) => [
            -1, -1, offset,      // 0
            1, -1, offset,       // 1
            1, 1, offset,        // 2
            -1, 1, offset,       // 3
        ];

        const front = (offset = 0) => [
            offset, offset + 1, offset + 2, offset, offset + 2, offset + 3
        ];
        const top = (offset = 0) => [
            offset + 6, offset + 3, offset + 2, offset + 6, offset + 7, offset + 3
        ];
        const bottom = (offset = 0) => [
            offset, offset + 4, offset + 1, offset + 5, offset + 1, offset + 4
        ];
        const left = (offset = 0) => [
            offset + 0, offset + 3, offset + 4, offset + 3, offset + 7, offset + 4
        ];
        const right = (offset = 0) => [
            offset + 1, offset + 5, offset + 2, offset + 5, offset + 6, offset + 2
        ];
        const back = (offset = 0) => [
            offset + 6, offset + 5, offset + 4, offset + 7, offset + 6, offset + 4
        ];

        // prettier-ignore
        const vertices = [
            ...wall(),
            ...wall(-2),
            ...wall(-4),
            ...wall(-6),

            ...wall(-8),
            ...wall(-10),
        ];

        // prettier-ignore
        const indices = [
            ...front(),

            ...bottom(),
            ...top(), 
            ...left(), 
            ...right(), 

            ...bottom(4), 
            ...top(4), 
            ...left(4), 
            ...right(4),

            ...bottom(8), 
            ...top(8), 
            ...left(8), 
            ...right(8), 

            ...back(8),

            ...front(16),
            ...bottom(16), 
            ...top(16), 
            ...left(16), 
            ...right(16),

            ...back(16)
        ];

        return {
            vertices,
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
