// Rotating cube, FixedFunction (FF) version.
import './style.css';
import { mat3, mat4 } from 'gl-matrix';
import { ATTRIB, createFixedFunction, LIGHTING } from './vendor/ff/ff';
import { createCube } from './Models/Cube';
import { createPrism } from './Models/Prism';
import { createSphere } from './Models/Sphere';
import { createSurface } from './Models/Surface';
import { createTriangularPrism } from './Models/TriangularPrism';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CLEAR_COLOR,
  GROUND_COLOR,
  ACTIVE_COLOR,
  INACTIVE_COLOR,
  NORMAL_OFFSET_BYTES,
  STRIDE_BYTES,
} from './constants';

type FF = ReturnType<typeof createFixedFunction>;

type Mesh =  {
  vao: WebGLVertexArrayObject;
  indexCount: number;
}

type Color = readonly [number, number, number, number];

type TankPart = {
  mesh: Mesh;
  position: readonly [number, number, number];
  scale: readonly [number, number, number];
  color: Color;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
};

type ArrowKey =
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'ArrowUp'
  | 'ArrowDown';

type Projectile = {
  loaded: boolean;
  position: [number, number, number];
  velocity: [number, number, number];
  radio: number;
};

// Step 1. Get the WebGL2 context.
function getContext(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvas.getContext('webgl2');
  if (!gl) throw new Error('WebGL2 is not available.');
  return gl;
}


// Step 3. Vertex specification: copy the vertex and index data to the GPU.
function createVertexBuffer(gl: WebGL2RenderingContext, data: Float32Array): WebGLBuffer {
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

function createIndexBuffer(gl: WebGL2RenderingContext, data: Uint16Array): WebGLBuffer {
  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
  return buffer;
}

// Step 4. Describe how the vertex data is laid out, using FF's attribute slots.
// No ATTRIB.COLOR: lit colors come from the material.
function createVAO(gl: WebGL2RenderingContext, vertices: WebGLBuffer, indices: WebGLBuffer): WebGLVertexArrayObject {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
  gl.enableVertexAttribArray(ATTRIB.POSITION);
  gl.vertexAttribPointer(ATTRIB.POSITION, 3, gl.FLOAT, false, STRIDE_BYTES, 0);
  gl.enableVertexAttribArray(ATTRIB.NORMAL);
  gl.vertexAttribPointer(ATTRIB.NORMAL, 3, gl.FLOAT, false, STRIDE_BYTES, NORMAL_OFFSET_BYTES);
  // The VAO remembers the ELEMENT_ARRAY_BUFFER bound while it is bound.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bindVertexArray(null);
  return vao;
}

function CreateMesh(gl: WebGL2RenderingContext, geometry: {vertices: Float32Array, indices: Uint16Array}): Mesh {
  const vertexBuffer = createVertexBuffer(gl, geometry.vertices);
  const indexBuffer = createIndexBuffer(gl, geometry.indices);

  return {
    vao: createVAO(gl, vertexBuffer, indexBuffer),
    indexCount: geometry.indices.length,
  };
}

// Step 5. Pipeline state: canvas size, viewport, clear color, depth test, face culling.
function setupState(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement): void {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(...CLEAR_COLOR);
  gl.enable(gl.DEPTH_TEST); // new vs. the triangle: nearer faces must hide farther ones
  gl.enable(gl.CULL_FACE); // skip back faces; front faces are counter-clockwise (the default)
}

// Step 6. Scene: lighting, one directional light, camera.
function setupScene(ff: FF): void {
  ff.enable(LIGHTING);
  ff.setGlobalAmbient([0.2, 0.2, 0.2, 1]); 

  // Directional light aimed toward the tank from the elevated camera side.
  ff.setLight(0, { position: [0.2, 1, 0.8, 0], diffuse: [1, 1, 1, 1] });
  ff.enableLight(0);

  const view = mat4.lookAt(mat4.create(), [0, 7, 13], [0, 2, 0], [0, 1, 0]);
  ff.setViewMatrix(view);
  const projection = mat4.perspective(mat4.create(), Math.PI / 4, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 100);
  ff.setProjectionMatrix(projection);
}

// ---------------------------------------------------------------------------
// Game loop. Every frame does three separate phases:
//   1. processInput: read what the user did.
//   2. update(dt): advance the simulation by the elapsed time dt.
//   3. render: draw the current state.
// Keep the phases apart: render never changes the state, and update never calls WebGL.
// ---------------------------------------------------------------------------

// Game state: everything the simulation needs, nothing about WebGL.
  const variablesControl = {
    TankX: 0,
    elevacionCanon: 0,
    movimientoTanque: 0,
    movimientoCanon: 0,
  };

  let arrowPressed: ArrowKey | null = null;
  let rPressed: boolean = false;
  let spacePressed: boolean = false;
  let power: number = 1;
  const projectile: Projectile = {
  loaded: true,
  position: [0, 0, 0],
  velocity: [0, 0, 0],
  radio: 0.15,
};
  let color2: readonly [number, number, number, number] = INACTIVE_COLOR
  let color3: readonly [number, number, number, number] = INACTIVE_COLOR

  function setupInput(): void {
    window.addEventListener('keydown', (e) => {
      if (e.code.startsWith('Arrow')) {
        e.preventDefault();
        arrowPressed =  e.code as ArrowKey;
      }
      if (e.code === 'Space') {
        e.preventDefault()
        if(!e.repeat) spacePressed = true;
      }

      if (e.code === 'KeyR') rPressed = true;
      if (e.repeat) return;

      switch (e.code) {
        case 'Digit1':
        case 'Numpad1':
          power = 1;
          break;
        case 'Digit2':
        case 'Numpad2':
          power = 2;
          break;
        case 'Digit3':
        case 'Numpad3':
          power = 3;
          break;
        case 'KeyF':
          power = power === 3 ? 1 : power + 1;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === arrowPressed) arrowPressed = null;
    })

    window.addEventListener('blur', () => {arrowPressed = null})
  }

  function processInput(): void {
    variablesControl.movimientoTanque =
      arrowPressed === 'ArrowRight' ? 1 :
      arrowPressed === 'ArrowLeft' ? -1 : 0;
    
    variablesControl.movimientoCanon =
      arrowPressed === 'ArrowUp' ? 1 :
      arrowPressed === 'ArrowDown' ? -1 : 0;

    if (power === 1) {color2 = INACTIVE_COLOR; color3 = INACTIVE_COLOR};
    if (power === 2) {color2 = ACTIVE_COLOR; color3 = INACTIVE_COLOR};
    if (power === 3) {color2 = ACTIVE_COLOR; color3 = ACTIVE_COLOR};

    if (spacePressed) {
      if (projectile.loaded) {
        const angulo = variablesControl.elevacionCanon;
        const distanciaBoca = 0.77 + projectile.radio;
        const velocidadInicial = 8 * power;

        projectile.position = [
          variablesControl.TankX + 0.2,
          0.9 + Math.sin(angulo) * distanciaBoca,
          4 - Math.cos(angulo) * distanciaBoca,
        ];

        projectile.velocity = [
          0,
          Math.sin(angulo) * velocidadInicial,
          -Math.cos(angulo) * velocidadInicial,
        ];

        projectile.loaded = false;
      }
      spacePressed = false;
    }
  }

  function update(dt:number): void {
    const velocidadTanque = 2.5;
    const velocidadCanon = 0.8;
    const elevacionMinima = 5 * Math.PI / 180;
    const elevacionMaxima = 90 * Math.PI / 180;

    variablesControl.TankX +=
      variablesControl.movimientoTanque * velocidadTanque * dt;

    variablesControl.elevacionCanon +=
      variablesControl.movimientoCanon * velocidadCanon * dt;

    variablesControl.elevacionCanon = Math.max(
      elevacionMinima,
      Math.min(variablesControl.elevacionCanon, elevacionMaxima),
    );

    if (!projectile.loaded) {
      projectile.velocity[1] -= 9.8 * dt;

      projectile.position[0] += projectile.velocity[0] * dt;
      projectile.position[1] += projectile.velocity[1] * dt;
      projectile.position[2] += projectile.velocity[2] * dt;

      if (projectile.position[1] <= projectile.radio) {
        projectile.loaded = true;
      }
    }
  }

// Loop phase 3. Draw the current state. render reads the state and never changes it.
// setMaterial runs every frame, so FF re-uploads the material each frame. That costs a few
// uniforms and keeps render simple. Exercise: set the material only when colorIndex changes.


function render(gl: WebGL2RenderingContext, 
  ff: FF, 
  ground: Mesh, 
  tanque: TankPart[], 
  TankX: number, 
  Sphere: Mesh, 
  PosicionSphere: readonly [number, number, number],): void {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  ff.setMaterial({
    ambient: GROUND_COLOR,
    diffuse: GROUND_COLOR
  });

  const model = mat4.create();
  const normalMatrix = mat3.create();
  mat4.identity(model);

  //Render superficie
  ff.setModelMatrix(model);
  ff.setNormalMatrix(mat3.normalFromMat4(normalMatrix, model));

  gl.bindVertexArray(ground.vao);
  ff.drawElements(gl.TRIANGLES, ground.indexCount, gl.UNSIGNED_SHORT, 0);
  //Render tanque
  for (const parte of tanque) {
    ff.setMaterial({ambient: parte.color, diffuse: parte.color});

    mat4.fromTranslation(model, [TankX, 0, 4]);
    mat4.translate(model, model, parte.position);
    if (parte.rotationX !== undefined) {
      mat4.rotateX(model, model, parte.rotationX);
    }
    if (parte.rotationY !== undefined) {
      mat4.rotateY(model, model, parte.rotationY);
    }
    if (parte.rotationZ !== undefined) {
      mat4.rotateZ(model, model, parte.rotationZ);
    }
    mat4.scale(model, model, parte.scale);

    ff.setModelMatrix(model);
    ff.setNormalMatrix(mat3.normalFromMat4(normalMatrix, model));

    gl.bindVertexArray(parte.mesh.vao);
    ff.drawElements(gl.TRIANGLES, parte.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
  }
  //Render bala / esfera

  ff.setMaterial({
    ambient: [0x1d / 255, 0x41 / 255, 0x70 / 255, 1],
    diffuse: [0x1d / 255, 0x41 / 255, 0x70 / 255, 1],
  });

  mat4.fromTranslation(model, PosicionSphere);
  ff.setModelMatrix(model);
  ff.setNormalMatrix(mat3.normalFromMat4(normalMatrix, model));
  gl.bindVertexArray(Sphere.vao);
  ff.drawElements(gl.TRIANGLES, Sphere.indexCount, gl.UNSIGNED_SHORT, 0);

  gl.bindVertexArray(null);
}

function run(canvas: HTMLCanvasElement): void {
  const gl = getContext(canvas);
  const ff = createFixedFunction(gl, {debug: true});

  setupState(gl, canvas);
  setupScene(ff);

  const ground = CreateMesh(gl, createSurface(100, 100));
  const cube = CreateMesh(gl, createCube(1, 0.7, 1));
  const wheels = CreateMesh(gl, createPrism(0.28, 2.2, 4));
  const wheels2 = CreateMesh(gl, createPrism(0.28, 2.2, 32));
  const cannon = CreateMesh(gl, createPrism(0.28, 2.2, 8));
  const sphere = CreateMesh(gl, createSphere(projectile.radio))
  const piezaTriangular = CreateMesh(gl, createTriangularPrism(0.65, 0.65, 1.8));
  const piezaBordeRueda = CreateMesh(gl, createTriangularPrism(0.65, 0.65, 1.8, true));
  const cannonParte: TankPart = {
      mesh: cannon,
      position: [0.2, 0.9, 0],
      scale: [0.5, 0.8, 0.5],
      color: [0x2d /255, 0x30/255, 0x17/255, 1],
      rotationX: -Math.PI /2,
    };
  const tanquesito: TankPart[] = [
    //chasis principal
    {
      mesh: cube,
      position: [0, 0.55, 0],
      scale: [1.7, 0.65, 2],
      color: [0.2, 0.22, 0.24, 1],
    },
    //bordes del chasis
    {
      mesh: piezaTriangular,
      position: [0.85, 0.32, 0.0001],
      scale: [0.7, 0.7, 1.1],
      color: [0.2, 0.22, 0.24, 1],
    },
    {
      mesh: piezaTriangular,
      position: [-0.85, 0.32, 0.0001],
      scale: [0.7, 0.7, 1.1],
      color: [0.2, 0.22, 0.24, 1],
      rotationY: Math.PI,
    },
    //bordes de las ruedas del tanque
    {
      mesh: piezaBordeRueda,
      position: [0.88, 0.09, 0.8],
      scale: [0.5, 0.41, 0.21],
      color: [0.1, 0.12, 0.13, 1],
    },
    {
      mesh: piezaBordeRueda,
      position: [0.88, 0.09, -0.8],
      scale: [0.5, 0.41, 0.21],
      color: [0.1, 0.12, 0.13, 1],
    },
    {
      mesh: piezaBordeRueda,
      position: [-0.88, 0.09, 0.8],
      scale: [0.5, 0.41, 0.21],
      color: [0.1, 0.12, 0.13, 1],
      rotationY: Math.PI,
    },
    {
      mesh: piezaBordeRueda,
      position: [-0.88, 0.09, -0.8],
      scale: [0.5, 0.41, 0.21],
      color: [0.1, 0.12, 0.13, 1],
      rotationY: Math.PI,
    },
    //ruedas
    { 
      mesh: wheels,
      position: [0, 0.28, -0.79],
      scale: [1, 0.8, 1],
      color: [0.1, 0.12, 0.13, 1],
      rotationX: Math.PI / 4,
      rotationZ: -Math.PI / 2,
    },
    {
      mesh: wheels,
      position: [0, 0.28, 0.79],
      scale: [1, 0.8, 1],
      color: [0.1, 0.12, 0.13, 1],
      rotationX: Math.PI / 4,
      rotationZ: -Math.PI / 2,
    },
    //parte superior del tanque
    {
      mesh: cube,
      position: [0.2, 0.9, 0.4],
      scale: [1, 0.5, 1],
      color: [0x54 /255, 0x61/255, 0x14/255, 1],
    },
    // canon
    cannonParte,
    //medidor potencia
    {
      mesh: cube,
      position: [0.58, 0.55, 0.8],
      scale: [0.4, 0.5, 0.5],
      color: color3,
    },
    {
      mesh: cube,
      position: [0.02, 0.55, 0.8],
      scale: [0.4, 0.5, 0.5],
      color: color2,
    },
    {
      mesh: cube,
      position: [-0.56, 0.55, 0.8],
      scale: [0.4, 0.5, 0.5],
      color: ACTIVE_COLOR,
    },

  ];

  let previousTime: number | undefined;

  function frame(timestamp: number): void {
    const dt = previousTime == undefined ? 0 : Math.min((timestamp - previousTime) / 1000, 0.05);

    previousTime = timestamp;

    processInput();
    tanquesito[11].color = power >= 3 ? ACTIVE_COLOR : INACTIVE_COLOR;
    tanquesito[12].color = power >= 2 ? ACTIVE_COLOR : INACTIVE_COLOR;
    update(dt);

    cannonParte.rotationX = -Math.PI / 2 + variablesControl.elevacionCanon;
    const angulo = variablesControl.elevacionCanon;
    const distanciaBoca = 0.77 + projectile.radio;
    const PosicionSphere: [number, number, number] = [
      variablesControl.TankX +0.2,
      0.9 + Math.sin(angulo) * distanciaBoca,
      4 - Math.cos(angulo) * distanciaBoca,
    ];

    render(gl, ff, ground, tanquesito, variablesControl.TankX, sphere, projectile.loaded ? PosicionSphere : projectile.position);
    requestAnimationFrame(frame);
  }

  setupInput();
  requestAnimationFrame(frame);
}

const canvas = document.createElement('canvas');
document.getElementById('stage')!.append(canvas);
run(canvas);
