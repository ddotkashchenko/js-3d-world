import * as THREE from 'three';
import World from './world';
import Controller from './controller';
import Controls from './controls';
// import VoxelTerrain from './voxelTerrain';
import { fromImage } from './heightmap';
import { makeCube, makePlane, makePyramid } from './scene';
import VoxelMesh from './voxelMesh';

export default class Builder {
    constructor() {
        this._threejs = new THREE.WebGLRenderer({ alpha: true });

        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;

        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);

        this._scene = new THREE.Scene();
        this._controller = { step: () => {} };

        this._next = [];
    }

    addPerspectiveCamera() {
        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000.0;
        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(0, 70, 30);
    }

    addDirectionalLight(pos) {
        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.intensity = 3;
        directionalLight.position.set(pos.x, pos.y, pos.z);
        directionalLight.target.position.set(0, 0, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.bias = -0.001;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.01;
        directionalLight.shadow.camera.far = 500.0;
        directionalLight.shadow.camera.left = 100;
        directionalLight.shadow.camera.right = -100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;

        this._scene.add(directionalLight);
    }

    addAmbientLight() {
        const ambientLight = new THREE.AmbientLight(0x808080);
        this._scene.add(ambientLight);
    }

    async addScene() {
        const heightMap = await fromImage({
            imgUrl: './iceland_heightmap.png',
        });

        const plane = makePlane(1000, 500);
        plane.name = 'terrain';

        heightMap.updatePlane(plane.geometry, 1700, { strenth: 70 });

        const terrain = new VoxelMesh({
            size: 2,
            name: 'voxelTerrain',
            material: {color: 0xbce791, wireframe: true},
        });

        const cells = heightMap.voxelize(4, 1000);
        const terrainMesh = terrain.construct(cells);
        this._scene.add(terrainMesh);

        const cube = makeCube(2);
        cube.name = 'cube';
        cube.position.set(0, 60, 0);

        const pyramid = makePyramid(4);
        this._scene.add(pyramid);

        this._controller = new Controller(this._scene, {
            terrain: plane,
        });

        this._next.push((t) => this._controller.step(t));

        this._scene.add(plane, cube);
    }

    addControls() {
        this._controls = new Controls(
            this._threejs.domElement,
            this._camera,
            this._scene,
            {
                move: (obj, vec) => {
                    this._controller.move(obj, vec);
                },
                activeObjectName: 'pyramid',
                excludeSelecting: ['terrain'],
            }
        );

        this._next.push((t) => this._controls.step(t));
    }

    build() {
        this._controls.bind();

        const world = new World(
            this._threejs,
            this._scene,
            this._camera,
            this._next
        );

        return world;
    }
}
