export interface Prism {
    vertices: Float32Array;
    indices: Uint16Array;
}

export function createPrism(radio = 1, altura = 2, lados = 3): Prism {
    if (!Number.isFinite(radio) || radio <= 0) throw new RangeError('Radio debe ser positivo finito');
    if (!Number.isFinite(altura) || altura <= 0) throw new RangeError('Altura debe ser positivo finito');
    if (!Number.isFinite(lados) || lados < 3) throw new RangeError('la cantidad de lados debe ser igual o mayor a tres');

    const MediaAltura = altura / 2;
    const vertices: number[] = [];
    const indices: number[] = [];

    function agregarVertice(x: number, y: number, z: number, nx: number, ny: number, nz: number): number {
        const index = vertices.length / 6;
        vertices.push(x, y, z, nx, ny, nz);
        return index;

    }

    for (let i = 0; i < lados; i++){
        const angulo0 = (i * 2 * Math.PI) / lados;
        const angulo1 = ((i + 1) * 2 * Math.PI) / lados;
        const anguloMedio = (angulo0 + angulo1) / 2;

        const x0 = radio * Math.cos(angulo0);
        const z0 = radio * Math.sin(angulo0);
        const x1 = radio * Math.cos(angulo1);
        const z1 = radio * Math.sin(angulo1);
        const nx = Math.cos(anguloMedio);
        const nz = Math.sin(anguloMedio);

        const fondo0 = agregarVertice(x0, -MediaAltura, z0, nx, 0, nz);
        const top0 = agregarVertice(x0, MediaAltura, z0, nx, 0, nz);
        const top1 = agregarVertice(x1, MediaAltura, z1, nx, 0, nz);
        const fondo1 = agregarVertice(x1, -MediaAltura, z1, nx, 0, nz);

        indices.push(fondo0, top0, top1, fondo0, top1, fondo1);
    }


    const topCentro = agregarVertice(0, MediaAltura, 0, 0, 1, 0);
    const topRing: number[] = [];
    for (let i = 0; i < lados; i++) {
        const angulo = (i * 2 * Math.PI) / lados;
        topRing.push(agregarVertice( radio * Math.cos(angulo), MediaAltura, radio * Math.sin(angulo), 0, 1, 0));
    }

    const fondoCentro = agregarVertice(0, -MediaAltura, 0, 0, -1, 0);
    const fondoRing: number[] = [];
    for (let i = 0; i < lados; i++) {
        const angulo = (i * 2 * Math.PI) / lados;
        fondoRing.push(agregarVertice( radio * Math.cos(angulo), -MediaAltura, radio * Math.sin(angulo), 0, -1, 0));
    }


    for (let i = 0; i < lados; i++) {
        const siguiente = (i + 1) % lados;
        
        indices.push(topCentro, topRing[siguiente], topRing[i]);
        indices.push(fondoCentro, fondoRing[i], fondoRing[siguiente]);
    }

    return {
        vertices: new Float32Array(vertices),
        indices: new Uint16Array(indices)
    };
}