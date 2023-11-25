import {
    MeshStandardMaterial,
    PlaneGeometry,
    BoxGeometry,
    Mesh
} from 'three';

function makePlane(size, segments) {
    const plane = new Mesh(
        new PlaneGeometry(size, size, segments, segments),
        new MeshStandardMaterial({ color: 0xbce791 })
    );
    plane.rotateX(-Math.PI / 2);
    plane.castShadow = true;
    plane.receiveShadow = true;

    return plane;
}

function makeCube(size) {
    const cube = new Mesh(
        new BoxGeometry(size, size, size, 1, 1, 1),
        new MeshStandardMaterial({ color: 0xff5555 })
    );
    
    cube.castShadow = true;
    cube.receiveShadow = true;

    return cube;
}

export { makePlane, makeCube };

// export default (heightMap, size) => {
//     const plane1 = makePlane(size, 800);
//     plane1.scale.add(new Vector3(10, 10, 10));

//     heightMap && heightMap.updatePlane(plane1.geometry, 100, { strenth: 7 });

//     const cube = makeCube(2);
//     const y = heightMap.setHeight(new Vector3(), 100)
//     cube.position.set(0, y, 0);

//     return [plane1, cube]; //Promise.resolve();
// };
