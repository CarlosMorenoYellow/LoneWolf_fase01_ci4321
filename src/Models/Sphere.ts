export interface SphereGeometry {
    vertices: Float32Array;
    indices: Uint16Array;
}

export function createSphere(radio = 1, latitudSegmentos = 16, longitudSegmentos = 32): SphereGeometry {
    if (!Number.isFinite(radio) || radio <= 0){
        throw new RangeError('radio de la esfera debe ser un numero finito positivo');
    }

    if (!Number.isInteger(latitudSegmentos) || latitudSegmentos < 2) {
        throw new RangeError('latitud de los segmentos de la esfera debe ser minimo 2');
    }

    if (!Number.isInteger(longitudSegmentos) || longitudSegmentos < 3) {
        throw new RangeError('longitud de los segmentos de la esfera debe ser minimo 3');
    }    

    const numeroDeVertex = ( latitudSegmentos + 1 ) * (longitudSegmentos + 1 );

    if ( numeroDeVertex > 65_536) {
        throw new RangeError('La esfera tiene demasiados vertices para Uint16 indices');
    }

    const DatosVertex: number[] = [];
    const DatosIndex: number[] = [];

    for (let segmentoLat = 0; segmentoLat <= latitudSegmentos; segmentoLat++) {
        const theta = (segmentoLat * Math.PI) / latitudSegmentos;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let segmentoLong = 0; segmentoLong <= longitudSegmentos; segmentoLong++) {
            const phi = (segmentoLong * 2 * Math.PI) / longitudSegmentos;

            const nx = sinTheta * Math.cos(phi)
            const ny = cosTheta;
            const nz = sinTheta * Math.sin(phi);

            DatosVertex.push(radio * nx, radio * ny, radio * nz, nx, ny, nz);
        }
    }


    for (let segmentoLat = 0; segmentoLat < latitudSegmentos; segmentoLat++){
        for (let segmentoLong = 0; segmentoLong < longitudSegmentos; segmentoLong++){
            const first = segmentoLat * (longitudSegmentos + 1) + segmentoLong;
            const below = first + longitudSegmentos + 1;

            if (segmentoLat > 0) {
                DatosIndex.push(first, first + 1, below);
            }

            if (segmentoLat < latitudSegmentos - 1 ){
                DatosIndex.push(first + 1, below + 1, below);
            }
        }
    }

    return {
        vertices: new Float32Array(DatosVertex),
        indices: new Uint16Array(DatosIndex),
    };
};