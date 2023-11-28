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

        const offsetVertex = (offset) => (x, y, z) => {
            const { ox, oy, oz } = { ...{ ox: 0, oy: 0, oz: 0 }, ...offset };
            const index = verticesGrouped.findIndex(
                ([vx, vy, vz]) => x + ox === vx && y + oy === vy && z + oz == vz
            );
            return index === -1
                ? verticesGrouped.push([x + ox, y + oy, z + oz]) - 1
                : index;
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
                ([vx, vy, vz]) => cx === vx && cy + 1=== vy && cz === vz
            );
        const isBoundaryBottom = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx === vx && cy - 1 === vy  && cz === vz
            );
        const isBoundaryLeft = ([cx, cy, cz]) =>
            !cells.some(
                ([vx, vy, vz]) => cx - 1=== vx && cy === vy && cz === vz
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

        let indices = cells.map(([cx, cy, cz]) => [
            ...(isBoundaryTop([cx, cy, cz])
                ? top(offsetVertex({ ox: cx * 2, oy: cy * 2, oz: cz * 2 }))
                : []),
            ...(isBoundaryBottom([cx, cy, cz])
                ? bottom(offsetVertex({ ox: cx * 2, oy: cy * 2, oz: cz * 2 }))
                : []),
            ...(isBoundaryLeft([cx, cy, cz])
                ? left(offsetVertex({ ox: cx * 2, oy: cy * 2, oz: cz * 2 }))
                : []),
            ...(isBoundaryRight([cx, cy, cz])
                ? right(offsetVertex({ ox: cx * 2, oy: cy * 2, oz: cz * 2 }))
                : []),
            ...(isBoundaryFront([cx, cy, cz])
                ? front(offsetVertex({ ox: cx * 2, oy: cy * 2, oz: cz * 2 }))
                : []),
            ...(isBoundaryBack([cx, cy, cz])
                ? back(offsetVertex({ ox: cx * 2, oy: cy * 2, oz: cz * 2 }))
                : []),
        ]).flat();

        return {
            vertices: verticesGrouped.flat(),
            indices,
        };
    }

    view() {
        const cells = [
            [0, 0, 0],
            [0, 0, 1],
            [0, 0, 2],
            [0, 0, 3],
            [1, 0, 3],
            [0, 1, 0],
        ];

        const voxels = this._construct(cells);

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
