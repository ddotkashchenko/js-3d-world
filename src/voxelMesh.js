import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshPhongMaterial,
    Vector3,
} from 'three';

export default class VoxelMesh {
    constructor(options) {

        options = { size: 2, position: new Vector3(), ...options };

        this._position = options.position;
        this._size = options.size;
        this._name = options.name;
        this._material = options.material;
    }

    _construct(cells) {
        const verticesGrouped = [];
        const verticesLookup = {};

        const offsetVertex =
            ([ox, oy, oz] = [0, 0, 0]) =>
            (x, y, z) => {

                x *= this._size;
                y *= this._size;
                z *= this._size;

                const key = `${x + ox}.${y + oy}.${z + oz}`;
                let index = verticesLookup[key];

                if (index) {
                    return index;
                }

                index = verticesGrouped.push([x + ox, y + oy, z + oz]) - 1;
                verticesLookup[key] = index;

                return index;
            };

        // prettier-ignore
        const front = (v = offsetVertex()) => [
            v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1),
            v(-1, -1, 1), v(1, 1, 1), v(-1, 1, 1)
        ];
        // prettier-ignore
        const top = (v = offsetVertex()) => [
            v(1, 1, 1), v(1, 1, -1), v(-1, 1, -1),
            v(-1, 1, 1), v(1, 1, 1), v(-1, 1, -1)
        ];
        // prettier-ignore
        const bottom = (v = offsetVertex()) => [
            v(1, -1, -1), v(1, -1, 1), v(-1, -1, 1), 
            v(-1, -1, -1), v(1, -1, -1), v(-1, -1, 1), 
        ];
        // prettier-ignore
        const left = (v = offsetVertex()) => [
            v(-1, 1, -1), v(-1, -1, -1), v(-1, -1, 1), 
            v(-1, 1, -1), v(-1, -1, 1), v(-1, 1, 1), 
        ];
        // prettier-ignore
        const right = (v = offsetVertex()) => [
            v(1, -1, 1), v(1, -1, -1), v(1, 1, -1), 
            v(1, 1, 1), v(1, -1, 1), v(1, 1, -1), 
        ];
        // prettier-ignore
        const back = (v = offsetVertex()) => [
            v(1, 1, -1), v(1, -1, -1), v(-1, -1, -1),
            v(-1, 1, -1), v(1, 1, -1), v(-1, -1, -1)
        ];

        const isBoundaryTop = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx === vx && cy + 1 === vy && cz === vz
            );
        const isBoundaryBottom = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx === vx && cy - 1 === vy && cz === vz
            );
        const isBoundaryLeft = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx - 1 === vx && cy === vy && cz === vz
            );
        const isBoundaryRight = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx + 1 === vx && cy === vy && cz === vz
            );
        const isBoundaryFront = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx === vx && cy === vy && cz + 1 === vz
            );
        const isBoundaryBack = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx === vx && cy === vy && cz - 1 === vz
            );

        let indices = cells
            .map((cell) => {
                const cellWithSize = cell.map(c => c * 2 * this._size);
                
                const res = [
                ...(isBoundaryTop(cell)
                    ? top(offsetVertex(cellWithSize))
                    : []),
                ...(isBoundaryBottom(cell)
                    ? bottom(offsetVertex(cellWithSize))
                    : []),
                ...(isBoundaryLeft(cell)
                    ? left(offsetVertex(cellWithSize))
                    : []),
                ...(isBoundaryRight(cell)
                    ? right(offsetVertex(cellWithSize))
                    : []),
                ...(isBoundaryFront(cell)
                    ? front(offsetVertex(cellWithSize))
                    : []),
                ...(isBoundaryBack(cell)
                    ? back(offsetVertex(cellWithSize))
                    : []),
                ];

                return res;
            })
            .flat();

        return {
            vertices: verticesGrouped.flat(),
            indices,
        };
    }

    construct(cells) {
        const voxels = this._construct(cells);

        const geometry = new BufferGeometry();
        geometry.setAttribute(
            'position',
            new BufferAttribute(new Float32Array(voxels.vertices), 3)
        );

        geometry.setIndex(voxels.indices);
        geometry.computeVertexNormals();

        const mesh = new Mesh(
            geometry,
            new MeshPhongMaterial({
                color: 0xaaaaff,
                flatShading: true,
                wireframe: false,
                ...this._material
            })
        );
        mesh.name = this._name;
        mesh.position.set(this._position.x, this._position.y, this._position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }
}
