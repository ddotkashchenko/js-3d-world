import * as THREE from 'three';
import Builder from './builder';


async function bootstrap() {
    const builder = new Builder();

    builder.addPerspectiveCamera();
    builder.addDirectionalLight(new THREE.Vector3(100, 50, 80));
    builder.addAmbientLight();
    // builder.addController();
    // await builder.addHeightmap();
    builder.addControls();
    await builder.addScene();

    return builder.build();
}

let _APP = null;

window.addEventListener('DOMContentLoaded', async () => {
    _APP = await bootstrap();
    _APP.start();
});
