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
        const heightMap = await fromImage({
            imgUrl: './iceland_heightmap.png',
        });

        new THREE.ImageBitmapLoader()
            .load('./iceland_heightmap.png', (bitmap) => {
                const pixelSize = 64;

                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width; canvas.height = bitmap.height;

                const ctx = canvas.getContext('2d');
                ctx.scale(1 / pixelSize, 1 / pixelSize);
                ctx.drawImage(bitmap, 0, 0);
                ctx.globalCompositeOperation = 'copy';
                ctx.imageSmoothingEnabled = false;
                ctx.setTransform(pixelSize, 0, 0, pixelSize, 0, 0);
                ctx.drawImage(canvas, 0, 0);

                const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

                createImageBitmap(imageData).then((downresBitmap) => {
                    const plane = new THREE.Mesh(
                        new THREE.PlaneGeometry(128, 128 / (heightMap.width / heightMap.height)),
                        new THREE.MeshStandardMaterial({
                            map: new THREE.CanvasTexture(downresBitmap)
                        })
                    );    
                    plane.position.set(0, 0, 100);
                    plane.rotateX(-Math.PI / 2);
                    plane.name = 'heightmap';
                    this._scene.add(plane);
                });
            });
        
        
        const makeTerrain = (size, res, position) => {
            const terrain2 = new VoxelMesh({
                size,
                name: 'voxelTerrain',
                position,
                material: {color: 0xbce791, wireframe: false},
            });

            const cells2 = heightMap.voxelize2(res, res / 4);
            terrain2.construct(cells2)
            this._scene.add(terrain2.mesh);
        };

        // makeTerrain(4, 16, new THREE.Vector3());
        // makeTerrain(2, 32, new THREE.Vector3())//.setComponent(1, -50));
        makeTerrain(1, 64, new THREE.Vector3()); //.setComponent(1, -100));
        // makeTerrain(0.5, 128, new THREE.Vector3());//.setComponent(1, -150))

        const cube = makeCube(2);
        cube.name = 'cube';
        cube.position.set(0, 50, 0);
        this._scene.add(cube);

        this._scene.add(
            makePyramid(4, 1, new THREE.Vector3(-10, 50, 0), {wireframe: false}),
        );

        this._controller = new Controller(this._scene, {
        });

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
                activeObjectName: 'heightmap',
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
