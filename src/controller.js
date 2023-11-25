export default class Controller {
    constructor(scene, options) {
        this._scene = scene;
        this._options = options;
    }

    step(t) {
        // this.makeCubeSpin();
    }

    move(obj, vec) {
        let z = obj.position.z;

        obj.position.add(vec);

        if (this._options && this._options.setHeight) {
          z = this._options.setHeight(obj.position);
        }
        
        obj.position.setComponent(1, z);
    }

    makeCubeSpin() {
        const cube = this._scene.getObjectByName('cube');
        cube.rotateY(0.01);
    }
}
