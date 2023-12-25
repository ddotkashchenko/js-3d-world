import * as THREE from 'three';
import { Math2 } from './math2';
import { Octree, octreeOrder } from '../octree';

class Heightmap {
    #bitmap;
    #canvas;

    constructor(options) {
        this.#bitmap = options.bitmap;
        this.#canvas = document.createElement('canvas');
        this.#canvas.width = this.#bitmap.width; 
        this.#canvas.height = this.#bitmap.height;

        Object.defineProperty(this, 'width', {
            value: this.#bitmap.width
        });
        Object.defineProperty(this, 'height', {
            value: this.#bitmap.height
        });
        Object.defineProperty(this, 'aspectRatio', {
            value: this.#bitmap.width / this.#bitmap.height
        });
    }

    load(pixelSize = 1) {
        const ctx = this.#canvas.getContext('2d');//, {willReadFrequently: true });
        ctx.scale(1 / pixelSize, 1 / pixelSize);
        ctx.drawImage(this.#bitmap, 0, 0);
        ctx.globalCompositeOperation = 'copy';
        ctx.imageSmoothingEnabled = false;
        ctx.setTransform(pixelSize, 0, 0, pixelSize, 0, 0);
        ctx.drawImage(this.#canvas, 0, 0);
        
        const {width, height} = this.#bitmap;
        const imageData = ctx.getImageData(0, 0, width, height);
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = true;

        const pixelAt = (x, y) => {
            const pos = (x + this.width * y) * 4;
            return imageData.data[pos] / 255.0;
        }
        return {

            width: this.#bitmap.width,
            height: this.#bitmap.height,
            pixelSize,

            downresBitmapAsync: () => createImageBitmap(imageData, {imageOrientation: 'flipY'}),

            octree: (maxY) => {
                const root = new Octree();
                const depth = Math.ceil(Math.log2(this.width / pixelSize));

                function build(parent, [px, py, pz], halfside, [ox, oy, oz] = [0, 0, 0], level = 0) {
                    let [dx, dy, dz] = [
                        Math.sign(px - ox), 
                        Math.sign(py - oy), 
                        Math.sign(pz - oz)];

                    const next = parent.set([dx, dy, dz])
                    
                    if(level < depth) {
                        const s = halfside / 2;
                        const newOffset = [
                            ox + dx * s,
                            oy + dy * s,
                            oz + dz * s
                        ];
                        build(next, [px, py, pz], s, newOffset, level + 1);
                    }   
                }

                const cellsHalfWidth = Math.ceil((this.width / pixelSize) / 2);
                const aspectRatio = this.width / this.height;
                const cellsHalfHeight = Math.ceil(cellsHalfWidth / aspectRatio);
        
                let cellX = -cellsHalfWidth;
                let cellZ = -cellsHalfHeight;

                for (let x = pixelSize / 2; x < this.width; x += pixelSize) {
                    for (let z = pixelSize / 2; z < this.height; z += pixelSize) {
                        const height = pixelAt(x, z);
                        const cellY = Math.ceil(maxY * height) || 1;
                        console.log('add: ', [cellX, cellY, cellZ]);
                        build(root, [cellX, cellY, cellZ], cellsHalfWidth);
                        cellZ++;
                    }
                    cellX++;
                    cellZ = -cellsHalfHeight;
                }

                return root;
            },
        }
    }
}

const fromImage = async ({ imgUrl, options }) => {
    return await new Promise((resolve) => {
        new THREE.ImageBitmapLoader()
            .setOptions({ imageOrientation: 'flipY', ...options })
            .load(imgUrl, (bitmap) => {
                resolve(
                    new Heightmap({
                        bitmap
                    })
                );
            });
    });
};

export { Heightmap, fromImage };
