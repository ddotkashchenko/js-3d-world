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

          if(pos == 2) return v * size + offset.x; // x
          if(pos == 1) return v * size + offset.y; // y
          if(pos == 0) return v * size + offset.z; // z
        });
    }

    view() {
        const geometry = new BufferGeometry();

        const c1 = this._cube();
        const c2 = this._cube(1, new Vector3(5, 2, 0));

        geometry.setAttribute(
            'position',
            new BufferAttribute(new Float32Array([...c1, ...c2]), 3)
        );
        geometry.computeVertexNormals();

        const mesh = new Mesh(
            geometry,
            new MeshStandardMaterial({ color: 0xffffff })
        );

        mesh.position.set(0, 50, 0);
        return mesh;
    }
}
