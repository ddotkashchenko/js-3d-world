import * as THREE from 'three';
import World from './world';
import Controller from './controller';
import Controls from './controls';
import { VoxelMesh } from './voxelMesh';
import {fromImage} from './heightmap';
import { makeCube, makeOctreeSphere, makePlane, makeWater } from './scene';

export default class Builder {
    #threejs;
    #scene;
    #controller;
    #next;
    #camera;

    constructor() {
        this.#threejs = new THREE.WebGLRenderer({ alpha: true });

        this.#threejs.shadowMap.enabled = true;
        this.#threejs.shadowMap.type = THREE.PCFSoftShadowMap;

        this.#threejs.setPixelRatio(window.devicePixelRatio);
        this.#threejs.setSize(window.innerWidth, window.innerHeight);

        this.#scene = new THREE.Scene();
        this.#controller = { step: () => {} };

        this.#next = [];
    }

    addPerspectiveCamera() {
        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 0.01;
        const far = 1000.0;
        this.#camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.#camera.position.set(0, 70, 30);
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
        directionalLight.shadow.camera.far = 1500.0;
        directionalLight.shadow.camera.left = 1000;
        directionalLight.shadow.camera.right = -1000;
        directionalLight.shadow.camera.top = 1000;
        directionalLight.shadow.camera.bottom = -100;

        this.#scene.add(directionalLight);
    }

    addAmbientLight() {
        const ambientLight = new THREE.AmbientLight(0x808080);
        this.#scene.add(ambientLight);
    }

    async addScene() {
        const icelandBitmap = await fromImage({
            imgUrl: './iceland_heightmap.png',
        });

        const makeTerrain = (width, heightY, heightmap, position) => {
            const size = width / (heightmap.width / (heightmap.pixelSize / 2));
            const terrain2 = new VoxelMesh({
                size,
                name: 'voxelTerrain',
                position,
                material: { color: 0xbce791, wireframe: false },
            });

            const cells2 = heightmap.voxelize2(heightY);
            terrain2.construct(cells2);
            this.#scene.add(terrain2.mesh);
        };

        const heightmap = icelandBitmap.load(16);
        makeTerrain(
            1280,
            12,
            heightmap,
            new THREE.Vector3()
        );

        this.#scene.add(
            makeWater(heightmap.width, heightmap.height, 4.5));

        this.#scene.add(
            makeCube({position: new THREE.Vector3(-100, 70, 0)}));

        const sphere = makeOctreeSphere({res: 4, name: 'octree-sphere', position: new THREE.Vector3(0, 170, 0)});
        this.#scene.add(sphere);
        
        this.#controller = new Controller(this.#scene, {});
        this.#next.push((t) => this.#controller.step(t));
    }

    addControls() {
        this._controls = new Controls(
            this.#threejs.domElement,
            this.#camera,
            this.#scene,
            {
                move: (obj, vec) => {
                    this.#controller.move(obj, vec);
                },
                excludeSelecting: ['terrain'],
            }
        );

        this.#next.push((t) => this._controls.step(t));
        this._controls.bindDefault();
    }

    build() {

        const world = new World(
            this.#threejs,
            this.#scene,
            this.#camera,
            this.#next
        );

        return world;
    }
}
