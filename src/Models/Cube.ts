export interface CubeGeometry {
    vertices: Float32Array;
    indices: Uint16Array;
}

export function createCube(width = 1, height = 1, depth = 1): CubeGeometry {
    if (!Number.isFinite(width) || width <= 0 ||
        !Number.isFinite(height) || height <= 0 ||
        !Number.isFinite(depth) || depth <= 0 
        ) {
            throw new RangeError('Las dimensiones del cubo deben ser numeros positivos finitos');
        }

    const x = width / 2;
    const y = height/ 2;
    const z = depth / 2;

    const vertices = new Float32Array([
        // Cara +Z
        -x, -y, z, 0, 0, 1,
        x, -y, z, 0, 0, 1,
        -x, y, z, 0, 0, 1,
        x, y, z, 0, 0, 1,

        // Cara -Z
        -x, -y, -z, 0, 0, -1,
        x, -y, -z, 0, 0, -1,
        -x, y, -z, 0, 0, -1,
        x, y, -z, 0, 0, -1,

        // Cara +X
        x, y, z, 1, 0, 0,
        x, -y, z, 1, 0, 0,
        x, y, -z, 1, 0, 0,
        x, -y, -z, 1, 0, 0,

        // Cara -X
        -x, y, z, -1, 0, 0,
        -x, -y, z, -1, 0, 0,
        -x, y, -z, -1, 0, 0,
        -x, -y, -z, -1, 0, 0,

        // Cara +Y
        x, y, z, 0, 1, 0,
        -x, y, z, 0, 1, 0,
        -x, y, -z, 0, 1, 0,
        x, y, -z, 0, 1, 0,

        // Cara -Y
        x, -y, z, 0, -1, 0,
        -x, -y, z, 0, -1, 0,
        -x, -y, -z, 0, -1, 0,
        x, -y, -z, 0, -1, 0,        
    ]);

    const indices = new Uint16Array([
        // Cara +Z
        0, 1, 3, 0, 3, 2,
        // Cara -Z
        4, 5, 6, 4, 6, 7,
        // Cara +X
        8, 9, 11, 8, 11, 10,
        // Cara -X
        12, 14, 15, 12, 15, 13,
        // Cara +Y
        16, 18, 17, 16, 19, 18,
        // Cara -Y
        20, 21, 22, 20, 22, 23,
    ]);

    return { vertices, indices };
}