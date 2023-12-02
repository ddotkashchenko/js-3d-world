import * as THREE from 'three';
import { Math2 } from './math2';

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
        const ctx = this.#canvas.getContext('2d');
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
            pixelSize,

            downresBitmapAsync: () => createImageBitmap(imageData, {imageOrientation: 'flipY'}),

            voxelize2: (maxY) => {
                let cells = {};//[];
                const aspectRatio = this.width / this.height;
                const cellSize = pixelSize;
                
                const cellsHalfWidth = Math.floor((this.width / pixelSize) / 2);
                const cellsHalfHeight = Math.floor(cellsHalfWidth / aspectRatio);
        
                let cellX = -cellsHalfWidth;
                let cellZ = -cellsHalfHeight;
        
                for (let x = pixelSize / 2; x < this.width; x += cellSize) {
                    for (let z = pixelSize / 2; z < this.height; z += cellSize) {
                        const height = pixelAt(x, z);
                        const cellY = Math.ceil(maxY * height) || 1;
        
                        for (let cy = 0; cy < cellY; cy++) {
                            cells[`${cellX}.${cy}.${cellZ}`] = [cellX, cy, cellZ];
                            // cells.push([cellX, cy, cellZ]);
                        }
                        cellZ++;
                    }
                    cellX++;
                    cellZ = -cellsHalfHeight;
                }
        
                return cells;
            },
        
        }
    }

    // updatePlane(geometry, size, options) {
    //     const positionAttribute = geometry.getAttribute('position');

    //     const vertex = new THREE.Vector3();
    //     for (let i = 0; i < positionAttribute.count; i++) {
    //         vertex.fromBufferAttribute(positionAttribute, i);

    //         const xf = (vertex.x + size * 0.5) / size;
    //         const yf = (vertex.y + size * 0.5) / size;
    //         const height = this._get(xf, yf) || 0;

    //         positionAttribute.setZ(i, height * options.strenth);
    //     }

    //     positionAttribute.needsUpdate = true;
    //     geometry.computeVertexNormals();
    // }

    
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
