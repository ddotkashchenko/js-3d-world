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

    _cube(options) {
        const { append, holes } = {
            append: {},
            holes: {},
            ...options,
        };

        // prettier-ignore
        const vertices = [
            ...[-1, -1, 1], //leftBottomFront
            ...[1, -1, 1], //rightBottomFront
            ...[1, 1, 1], //rightTopFront
            ...[-1, 1, 1], //leftTopFront

            ...[-1, -1, -1], //leftBottomBack
            ...[1, -1, -1], //rightBottomBack
            ...[1, 1, -1], //rightTopBack
            ...[-1, 1, -1], //leftTopBack
        ].map((v, i) => {
            const pos = i % 3;

            // if(pos == 2) return v + offset.x; // x
            // if(pos == 1) return v + offset.y; // y
            if (pos == 2) return v + (append.z ? 2 : 0); // z
            return v;
        });

        // prettier-ignore
        const indices = [
            ...(holes.front ? [] : [0, 1, 2, 0, 2, 3]), // front
            0, 4, 1, 5, 1, 4, // bottom
            6, 3, 2, 6, 7, 3, // top
            ...(holes.back ? [] : [6, 5, 4, 6, 4, 7]), // back
            0, 3, 4, 3, 7, 4, // left
            1, 5, 2, 5, 6, 2, // right
        ];

        return { vertices, indices };
    }

    view() {
        const voxels = [
            this._cube({ holes: {front: true} }),
            this._cube({ holes: {back: true}, append: { z: true } }),
        ];

        const geometry = new BufferGeometry();
        geometry.setAttribute(
            'position',
            new BufferAttribute(
                new Float32Array(voxels.flatMap((v) => v.vertices)),
                3
            )
        );

        const mergedIndices = voxels.reduce(
            (acc, curr) => ({
                offset: acc.offset + curr.vertices.length / 3,
                indices: [
                    ...acc.indices,
                    ...curr.indices.map((index) => index + acc.offset),
                ],
            }),
            {
                indices: [],
                offset: 0,
            }
        );
        geometry.setIndex(mergedIndices.indices);

        const mesh = new Mesh(
            geometry,
            new MeshPhongMaterial({ color: 0xaaaaff, flatShading: true, wireframe: true })
        );
        mesh.name = 'terrain';
        mesh.position.set(0, 50, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }
}
