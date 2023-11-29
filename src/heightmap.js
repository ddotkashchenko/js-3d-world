import * as THREE from 'three';
import { Math2 } from './math2';

class Heightmap {
    constructor(options) {
        this._width = options.width;
        this._height = options.height;
        this._heightData = options.heightData;
    }

    updatePlane(geometry, size, options) {
        const positionAttribute = geometry.getAttribute('position');

        const vertex = new THREE.Vector3();
        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromBufferAttribute(positionAttribute, i);

            const xf = (vertex.x + size * 0.5) / size;
            const yf = (vertex.y + size * 0.5) / size;
            const height = this._get(xf, yf) || 0;

            positionAttribute.setZ(i, height * options.strenth);
        }

        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();
    }

    voxelize(resolution) {
        let cells = [];
        const cellSize = Math.ceil(255 / resolution);
        const cellsHalfWidth = this._width / (cellSize * 2);
        const cellsHalfHeight = this._height / (cellSize * 2);
        
        let cellX = -cellsHalfWidth;
        let cellZ = -cellsHalfHeight;

        for (let x = 0; x < this._width; x += cellSize) {
            for (let z = 0; z < this._height; z += cellSize) {

                const height = this._pixelAt(x + cellSize / 2, z + cellSize / 2) || 0;
                const heightCells = Math.ceil(height * 255 / cellSize) + 1;

                cells = [
                    ...cells,
                    ...[...Array(heightCells).keys()].map((cellY) => [cellX, cellY, cellZ]),
                ];
                cellZ++;
            }
            cellX++;
            cellZ = -cellsHalfHeight;
        }

        return cells;
    }

    _pixelAt(x, y) {
        const pos = (x + this._width * y) * 4;
        return this._heightData[pos] / 255.0;
    }

    _get(xf, yf) {
        const w = this._width - 1;
        const h = this._height - 1;

        const x1 = Math.floor(xf * w);
        const y1 = Math.floor(yf * h);
        const x2 = Math2.clamp(x1 + 1, 0, w);
        const y2 = Math2.clamp(y1 + 1, 0, h);

        const xp = xf * w - x1;
        const yp = yf * h - y1;

        const p11 = this._pixelAt(x1, y1);
        const p12 = this._pixelAt(x1, y2);
        const p21 = this._pixelAt(x2, y1);
        const p22 = this._pixelAt(x2, y2);

        const px1 = Math2.lerp(xp, p11, p21);
        const px2 = Math2.lerp(xp, p12, p22);

        return Math2.lerp(yp, px1, px2);
    }
}

const fromImage = async ({ imgUrl }) => {
    return await new Promise((resolve) => {
        new THREE.ImageBitmapLoader()
            .setOptions({ imageOrientation: 'flipY' })
            .load(imgUrl, (img) => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const context = canvas.getContext('2d');
                context.drawImage(img, 0, 0);

                const imageData = context.getImageData(
                    0,
                    0,
                    img.width,
                    img.height
                );

                resolve(
                    new Heightmap({
                        width: img.width,
                        height: img.height,
                        heightData: imageData.data,
                    })
                );
            });
    });
};

export { Heightmap, fromImage };
