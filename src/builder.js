import * as THREE from 'three';
import World from './world';
import Controller from './controller';
import Controls from './controls';
import { VoxelMesh } from './voxelMesh';
import {Heightmap, fromImage} from './heightmap';
import { makeCube, makeOctreePyramid, makeOctreeSphere, makePlane, makeWater } from './scene';

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
        const near = 0.01;
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
        directionalLight.shadow.camera.far = 1500.0;
        directionalLight.shadow.camera.left = 1000;
        directionalLight.shadow.camera.right = -1000;
        directionalLight.shadow.camera.top = 1000;
        directionalLight.shadow.camera.bottom = -100;

        this._scene.add(directionalLight);
    }

    addAmbientLight() {
        const ambientLight = new THREE.AmbientLight(0x808080);
        this._scene.add(ambientLight);
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
            this._scene.add(terrain2.mesh);
        };

        const heightmap = icelandBitmap.load(16);
        makeTerrain(
            1280,
            12,
            heightmap,
            new THREE.Vector3()
        );

        this._scene.add(
            makeWater(heightmap.width, heightmap.height, 4.5));

        this._scene.add(
            makeCube({position: new THREE.Vector3(-100, 70, 0)}));

        const sphere = makeOctreeSphere({res: 4, position: new THREE.Vector3(0, 170, 0)});
        this._scene.add(sphere);
        
        const bh = new THREE.BoxHelper(sphere, 0xFFFF00);
        bh.position.add(sphere.position);

        this._scene.add(bh);


        // this._scene.children.forEach(c => {
        //     const bh = new THREE.BoxHelper(c, 0xFFFF00);
        //     bh.position.add(c.position);
        //     this._scene.add(bh);
        // });

        this._controller = new Controller(this._scene, {});
        this._next.push((t) => this._controller.step(t));
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
