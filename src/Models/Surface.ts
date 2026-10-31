export interface SurfaceGeometry {
    vertices: Float32Array;
    indices: Uint16Array;
}

export function createSurface(width = 10, depth = 10): SurfaceGeometry {
    if (!Number.isFinite(width) || width <= 0) throw new RangeError('El ancho debe ser un numero finito positivo');
    if (!Number.isFinite(depth) || depth <= 0) throw new RangeError('La profundidad debe ser un numero finito positivo');

    const halfWidth = width / 2;
    const halfDepth = depth / 2;

    const vertices = new Float32Array([

        -halfWidth, 0, -halfDepth, 0, 1, 0,
        halfWidth, 0, -halfDepth, 0, 1, 0,
        halfWidth, 0, halfDepth, 0, 1, 0,
        -halfWidth, 0, halfDepth, 0, 1, 0,

    ]);

    const indices = new Uint16Array([

        0, 3, 2,
        0, 2, 1,

    ]);

    return {vertices, indices}
}

