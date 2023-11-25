import * as THREE from 'three';
import World from './world';
import Controller from './controller';
import Controls from './controls';
import { fromImage } from './heightmap';
import { makeCube, makePlane } from './scene';

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
        this._camera.position.set(0, 125, 50);
    }

    addDirectionalLight(pos) {
        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.intensity = 3;
        directionalLight.position.set(pos.x, pos.y, pos.z);
        directionalLight.target.position.set(0, 0, 0);
        directionalLight.castShadow = true;
        directionalLight.shadow.bias = -0.01;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 500.0;
        directionalLight.shadow.camera.near = 0.5;
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

    // async addHeightmap() {
    //     this._heightMap = await fromImage({ imgUrl: './iceland_heightmap.png' });
    //     return Promise.resolve();
    // }

    async addScene() {
        const heightMap = await fromImage({
            imgUrl: './iceland_heightmap.png',
        });

        const plane = makePlane(100, 500);
        plane.scale.add(new THREE.Vector3(10, 10, 10));

        heightMap.updatePlane(plane.geometry, 100, { strenth: 7 });

        const cube = makeCube(2);
        cube.name = 'cube';

        const heigthTracer = new THREE.Raycaster(
            new THREE.Vector3(0, 500, 0), THREE.Scene.DEFAULT_UP.negate()); 

        this._controller = new Controller(this._scene, {
            setHeight: (vec) => {
                heigthTracer.set(new THREE.Vector3(vec.x, 500, vec.z), 
                    THREE.Scene.DEFAULT_UP);
                const intersection = heigthTracer.intersectObject(plane);
                return intersection.length && intersection[0].point.y + 1;
            }
        });

        this._next.push((t) => this._controller.step(t));

        this._scene.add(plane, cube)
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
                activeObjectName: 'cube',
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
