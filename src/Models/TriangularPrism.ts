export interface TriangularPrismGeometry {
  vertices: Float32Array;
  indices: Uint16Array;
}

type Point3 = readonly [number, number, number];

export function createTriangularPrism(
  width = 1,
  height = 1,
  length = 1,
  inverted = false,
): TriangularPrismGeometry {
  if (
    !Number.isFinite(width) || width <= 0 ||
    !Number.isFinite(height) || height <= 0 ||
    !Number.isFinite(length) || length <= 0
  ) {
    throw new RangeError('Las dimensiones del prisma triangular deben ser números positivos finitos');
  }

  const halfLength = length / 2;
  const section: readonly (readonly [number, number])[] = inverted
    ? [[0, 0], [width, height], [0, height]]
    : [[0, 0], [width, 0], [0, height]];
  const back = section.map(([x, y]): Point3 => [x, y, -halfLength]);
  const front = section.map(([x, y]): Point3 => [x, y, halfLength]);

  const vertices: number[] = [];
  const indices: number[] = [];

  function addTriangle(a: Point3, b: Point3, c: Point3): void {
    const abX = b[0] - a[0];
    const abY = b[1] - a[1];
    const abZ = b[2] - a[2];
    const acX = c[0] - a[0];
    const acY = c[1] - a[1];
    const acZ = c[2] - a[2];

    const nx = abY * acZ - abZ * acY;
    const ny = abZ * acX - abX * acZ;
    const nz = abX * acY - abY * acX;
    const magnitude = Math.hypot(nx, ny, nz);
    const normal: Point3 = [nx / magnitude, ny / magnitude, nz / magnitude];

    for (const point of [a, b, c]) {
      vertices.push(...point, ...normal);
      indices.push(indices.length);
    }
  }

  addTriangle(front[0], front[1], front[2]);
  addTriangle(back[0], back[2], back[1]);

  for (let i = 0; i < section.length; i++) {
    const next = (i + 1) % section.length;
    addTriangle(back[i], back[next], front[next]);
    addTriangle(back[i], front[next], front[i]);
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
  };
}
