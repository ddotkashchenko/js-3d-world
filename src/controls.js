import * as THREE from 'three';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

export default class Controls {
    constructor(domElement, camera, scene, options) {
        this._camera = camera;
        this._domElement = domElement;
        this._scene = scene;
        this._options = options;

        this._orbitControls = new OrbitControls(camera, domElement);
        this._orbitControls.target.set(0, 0, 0);
        this._orbitControls.update();

        this._rayCaster = new THREE.Raycaster();

        this._activeObject = null;
        this._previousPosition = new THREE.Vector3();
    }

    step(t) {
        if (!this._activeObject) {
            this._activeObject = this._scene.getObjectByName(
                this._options.activeObjectName
            );

            this._focused = false
        }

        if (this._activeObject && !this._focused) {
            this.focusActiveObject();
        }
    }

    focusActiveObject() {
        const currentPosition = this._activeObject.position;

        if (!currentPosition.equals(this._previousPosition)) {
            const { x, y, z } = currentPosition;
            this._orbitControls.target.set(x, y, z);

            this._orbitControls.update();
            this._focused = true;
        }
    }

    bind() {
        let drag = false;
        this._domElement.addEventListener('mousedown', (e) => {
            if(e.buttons == 1)
                drag = false;
        });
        this._domElement.addEventListener('mousemove', (e) => {
            if(e.buttons == 1)
                drag = true;
        });
        this._domElement.addEventListener('click', (e) => {
            if (drag || e.buttons == 1) return;
            const pointer = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );

            this._rayCaster.setFromCamera(pointer, this._camera);

            const intersects = this._rayCaster
                .intersectObjects(this._scene.children)
                // .filter(
                //     (i) =>
                //         !this._options.excludeSelecting.some(
                //             (e) => i.object.name === e
                //         )
                // );

            if (intersects.length) {
                const newPos = this._orbitControls.target
                    .clone()
                    .add(new THREE.Vector3(10, 10, 0));
                this._camera.position.set(newPos.x, newPos.y, newPos.y);
                this._activeObject = intersects[0].object;
                this._focused = false;
            }
        });

        // window.addEventListener('keydown', (e) => {
        //     const vec = new THREE.Vector3();
        //     switch (e.key) {
        //         case 'w':
        //             vec.add(new THREE.Vector3(0, 0, -1));
        //             break;
        //         case 's':
        //             vec.add(new THREE.Vector3(0, 0, 1));
        //             break;
        //         case 'a':
        //             vec.add(new THREE.Vector3(1, 0, 0));
        //             break;
        //         case 'd':
        //             vec.add(new THREE.Vector3(-1, 0, 0));
        //             break;
        //     }
        //     this._options.move && this._options.move(this._activeObject, vec);
        //     this._camera.position.add(vec);
        // });
    }
}
