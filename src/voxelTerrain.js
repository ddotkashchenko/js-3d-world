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

    _construct() {
        // prettier-ignore
        const vertices = [
            -1, -1, 1,      // 0
            1, -1, 1,       // 1
            1, 1, 1,        // 2
            -1, 1, 1,       // 3

            -1, -1, -1,     // 4
            1, -1, -1,      // 5
            1, 1, -1,       // 6
            -1, 1, -1,      // 7

            -1, -1, -3,     // 8
            1, -1, -3,      // 9
            1, 1, -3,       // 10
            -1, 1, -3,      // 11
        ];

        // prettier-ignore
        const indices = [
            0, 1, 2, 0, 2, 3,   // front

            0, 4, 1, 5, 1, 4,   // bottom
            6, 3, 2, 6, 7, 3,   // top
            0, 3, 4, 3, 7, 4,   // left
            1, 5, 2, 5, 6, 2,   // right

            4, 8, 5, 9, 5, 8,   // bottom
            10, 7, 6, 10, 11, 7,   // top
            4, 7, 8, 7, 11, 8,   // left
            5, 9, 6, 9, 10, 6,   // right

            10, 9, 8, 11, 10, 8 // back
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
