import * as THREE from 'three';
import World from './world';
import Controller from './controller';
import Controls from './controls';
import { VoxelMesh } from './voxelMesh';
import { fromImage } from './heightmap';
import { makeCube, makeOctreeSphere, makePlane, makeWater, octreeSphereNew } from './scene';
import OctreeDebugMesh from './octreeMesh';
import { Octree } from '../octree';

export default class Builder {
    #threejs;
    #scene;
    #controller;
    #next;
    #camera;
    #voxelMeshes;
    #controls;

    constructor() {
        this.#threejs = new THREE.WebGLRenderer({ alpha: true });

        this.#threejs.shadowMap.enabled = true;
        this.#threejs.shadowMap.type = THREE.PCFSoftShadowMap;

        this.#threejs.setPixelRatio(window.devicePixelRatio);
        this.#threejs.setSize(window.innerWidth, window.innerHeight);

        this.#scene = new THREE.Scene();
        this.#controller = { step: () => {} };

        this.#next = [];
        this.#voxelMeshes = [];
    }

    addPerspectiveCamera() {
        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 0.01;
        const far = 1000.0;
        this.#camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.#camera.position.set(-90, 50, 90);
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
            const terrain = new VoxelMesh({
                size,
                name: 'voxelTerrain',
                position,
                material: { color: 0xbce791, wireframe: false },
            });

            const cells = heightmap.voxelize2(heightY);
            terrain.construct(cells);
            this.#voxelMeshes.push(terrain);
        };

        const heightmap = icelandBitmap.load(16);
        makeTerrain(1280, 12, heightmap, new THREE.Vector3());

        this.#scene.add(makeWater(heightmap.width, heightmap.height, 4.5));
        this.#scene.add(makeCube({ position: new THREE.Vector3(-100, 71, 0) }));

        const sphere = new Octree();
        octreeSphereNew(sphere, 4);

        const os = new OctreeDebugMesh(sphere, [0, 170, 0], 'octree-sphere');
        this.#voxelMeshes.push(os);

        os.draw();

        this.#controller = new Controller(this.#scene, {});
        this.#next.push((t) => this.#controller.step(t));

        this.#voxelMeshes.forEach(({ mesh }) => this.#scene.add(mesh));
    }

    addControls() {
        this.#controls = new Controls(
            this.#threejs.domElement,
            this.#camera,
            this.#scene,
            {
                move: (obj, vec) => {
                    this.#controller.move(obj, vec);
                },
                excludeSelecting: ['terrain'],
                activeObjectName: 'octree-sphere',
            }
        );

        this.#next.push((t) => this.#controls.step(t));

        this.#controls.bindDefault();

        let sphereTopLevel = 0;

        this.#controls.bindKey('+', () => {
            sphereTopLevel = Math.max(0, sphereTopLevel);
            const sphere = this.#voxelMeshes.find(
                (vm) => vm.name === 'octree-sphere'
            );
            sphere.draw(Math.min(++sphereTopLevel, 6));
        });

        this.#controls.bindKey('-', () => {
            const sphere = this.#voxelMeshes.find(
                (vm) => vm.name === 'octree-sphere'
            );
            sphere.draw(Math.max(--sphereTopLevel, 0))
        });

        let radius = 1.666;
        const radStep = 0.05;

        this.#controls.bindKey('*', () => {
            const sphere = this.#voxelMeshes.find(vm => vm.name === 'octree-sphere');
            radius += radStep;
            octreeSphereNew(sphere.shape, sphereTopLevel, radius);
            sphere.draw(sphereTopLevel);
        });

        this.#controls.bindKey('/', () => {
            const sphere = this.#voxelMeshes.find(vm => vm.name === 'octree-sphere');
            radius = Math.max(1, radius - radStep)
            octreeSphereNew(sphere.shape, sphereTopLevel, radius);
            sphere.draw(sphereTopLevel);
        });

        this.#controls.bindKey('8', () => {
            const sphere = this.#voxelMeshes.find(vm => vm.name === 'octree-sphere');
            const top = sphere.shape.cells.filter(c => c.position[1] === -1);

            for(const cell of top) {
                octreeSphereNew(cell, sphereTopLevel + 1, radius, 1, cell.position.map(c => c / 2));
            }
            sphere.draw(++sphereTopLevel);
        });
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
