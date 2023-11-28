import {
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshPhongMaterial,
    Vector3,
} from 'three';

export default class VoxelMesh {
    constructor(options = { size: 2, position: new Vector3() }) {
        this._position = options.position;
        this._size = options.size;
        this._name = options.name;
    }

    _construct(cells) {
        const verticesGrouped = [];
        const verticesLookup = {};

        const offsetVertex =
            ([ox, oy, oz] = [0, 0, 0]) =>
            (x, y, z) => {
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
            .map((cell) => [
                ...(isBoundaryTop(cell)
                    ? top(offsetVertex(cell.map((c) => c * this._size)))
                    : []),
                ...(isBoundaryBottom(cell)
                    ? bottom(offsetVertex(cell.map((c) => c * this._size)))
                    : []),
                ...(isBoundaryLeft(cell)
                    ? left(offsetVertex(cell.map((c) => c * this._size)))
                    : []),
                ...(isBoundaryRight(cell)
                    ? right(offsetVertex(cell.map((c) => c * this._size)))
                    : []),
                ...(isBoundaryFront(cell)
                    ? front(offsetVertex(cell.map((c) => c * this._size)))
                    : []),
                ...(isBoundaryBack(cell)
                    ? back(offsetVertex(cell.map((c) => c * this._size)))
                    : []),
            ])
            .flat();

        return {
            vertices: verticesGrouped.flat(),
            indices,
        };
    }

    construct(cells) {
        const pyramid4 = [...Array(4).keys()]
            .map((y) => {
                const res = [];
                const width = 3 - y;
                for (var x = -width; x <= width; x++)
                    for (var z = -width; z <= width; z++) {
                        if (y !== 1 || z !== 0) res.push([x, y, z]);
                    }

                return res;
            })
            .flat();

        const voxels = this._construct(pyramid4);

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
            })
        );
        mesh.name = this._name;
        mesh.position.set(this._position.x, this._position.y, this._position.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }
}
