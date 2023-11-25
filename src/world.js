export default class World {
    constructor(renderer, scene, camera, next = []) {
        this._threejs = renderer;
        this._scene = scene;
        this._camera = camera;
        this._next = next;
    }

    start() {
        document.body.appendChild(this._threejs.domElement);

        window.addEventListener(
            'resize',
            () => {
                this._OnWindowResize();
            },
            false
        );

        this._previousRaf = null;
        this._RAF();
    }

    _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
    }

    _RAF() {
        requestAnimationFrame((t) => {
            this._threejs.render(this._scene, this._camera);
            this._RAF();

            for(const n of this._next) {
                n(t - this._previousRaf || t)
            }

            this._previousRaf = t;
        });
    }
}
