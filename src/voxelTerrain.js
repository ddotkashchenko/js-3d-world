import {
    BoxGeometry,
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshStandardMaterial,
    Vector3,
} from 'three';

export default class VoxelTerrain {
    constructor(size) {
        this._size = size;
        this._resolution = 1;

        this._cells = [];
    }

    _cube() {
        const vertices = [
            -1, -1, 1,  //leftBottomFar
            1, -1, 1,   //rightBottomFar
            1, 1, 1,    //rightTopFar
            -1, 1, 1,   //leftTopFar

            -1, -1, -1, //leftBottomNear
            1, -1, -1,  //rightBottomNear
            1, 1, -1,   //rightTopNear
            -1, 1, -1,  //leftTopNear
        ]; 

        const indices = [
            0, 1, 2, 0, 2, 3, //front
            0, 4, 1, 5, 1, 4, //bottom
            6, 3, 2, 6, 7, 3, //top
            6, 5, 4, 6, 4, 7, //back
            0, 3, 4, 3, 7, 4, // left
            1, 5, 2, 5, 6, 2
        ];

        return { vertices, indices };
    }

    view() {
        const voxel = this._cube();

        const geometry = new BufferGeometry();
        geometry.setAttribute(
            'position',
            new BufferAttribute(
                new Float32Array(voxel.vertices), 3)
        );
        geometry.setIndex(voxel.indices);
        geometry.computeVertexNormals();

        const mesh = new Mesh(
            geometry,
            new MeshStandardMaterial({ color: 0xffffff, wireframe: false })
        );
        mesh.name = 'terrain';
        mesh.position.set(0, 50, 0);

        return mesh;
    }
}
