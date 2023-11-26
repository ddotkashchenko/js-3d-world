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

    _cube(size = 1, offset) {
      if(!offset) offset = new Vector3();
        return [
            // front
            -1, -1, 1, 1, -1, 1, -1, 1, 1, 
            -1, 1, 1, 1, -1, 1, 1, 1, 1,
            // back
            1, -1, -1, -1, -1, -1, 1, 1, -1, 
            1, 1, -1, -1, -1, -1, -1, 1, -1,
            // left
            -1, -1, -1, -1, -1, 1, -1, 1, -1, 
            -1, 1, -1, -1, -1, 1, -1, 1, 1,
            // right
            1, -1, 1, 1, -1, -1, 1, 1, 1, 
            1, 1, 1, 1, -1, -1, 1, 1, -1,
            // top
            1, 1, -1, -1, 1, -1, 1, 1, 1, 
            1, 1, 1, -1, 1, -1, -1, 1, 1,
            // bottom
            1, -1, 1, -1, -1, 1, 1, -1, -1, 
            1, -1, -1, -1, -1, 1, -1, -1, -1,
        ].map((v, i) => {
          const pos = i % 3;

          if(pos == 2) return v * size + offset.x;
          if(pos == 1) return v * size + offset.y;
          if(pos == 0) return v * size + offset.z;
        });
    }

    view() {
        const vertices = new Float32Array([
            ...this._cube(),
            ...this._cube(1, new Vector3(0, 0, 2)),
            ...this._cube(1, new Vector3(2, 0, 0)),
            ...this._cube(1, new Vector3(2, 0, 2))
        ]);
        
        const geometry = new BufferGeometry();
        geometry.setAttribute(
            'position',
            new BufferAttribute(vertices, 3)
        );
        geometry.computeVertexNormals();

        const mesh = new Mesh(
            geometry,
            new MeshStandardMaterial({ color: 0xffffff, wireframe: false })
        );

        mesh.position.set(0, 50, 0);
        return mesh;
    }
}
