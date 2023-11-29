import * as THREE from 'three';

export default class Controller {
    constructor(scene, options) {
        this._scene = scene;
        this._options = options;

        this._down = THREE.Scene.DEFAULT_UP;
        this._down.negate();

        this._heigthTracer = new THREE.Raycaster(
            new THREE.Vector3(0, 500, 0),
            this._down
        );
    }

    step(t) {
        this.makeObjectSpin('cube', -0.01);
        // this.makeObjectSpin('pyramid', 0.01);
    }

    async move(obj, vec) {
        let height = obj.position.z;

        obj.position.add(vec);

        if (this._options && this._options.terrain) {
            height = await this._setHeight(obj.position, this._options.terrain);
        }

        obj.position.setComponent(1, height);
    }

    _setHeight(vec, terrain) {
        return new Promise((resolve) =>
            setTimeout(() => {
                this._heigthTracer.set(
                    new THREE.Vector3(vec.x, 500, vec.z),
                    this._down
                );
                const intersection = this._heigthTracer.intersectObject(terrain);
                const height = intersection.length && intersection[0].point.y + 1;
                console.log('vec: ', vec, 'height: ', height);
                resolve(height);
            }, 0)
        );
    }

    makeObjectSpin(name, speed) {
        const cube = this._scene.getObjectByName(name);
        cube.rotateY(speed);
    }
}
