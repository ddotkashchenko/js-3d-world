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
            this._camera.position.add(this._orbitControls.target);
            this._orbitControls.update();
            this._focused = true;
        }
    }

    // make binds dictionary
    bindKey(bindKey, handler) {
        this._domElement.addEventListener('keydown', ({key}) => {
            if(key === bindKey) {
                handler()
            }
        });
    }

    bindDefault() {
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
                
                this._activeObject = intersects[0].object;
                this._focused = false;
            }
        });
    }
}
