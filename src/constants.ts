// Scene constants: geometry, colors and canvas settings. main.ts holds the WebGL code and the game loop.

/** Background color #87CEEB as linear floats in [0, 1]. */
export const CLEAR_COLOR: readonly [number, number, number, number] = [0x87 / 255, 0xce / 255, 0xeb / 255, 1];

/** Drawing buffer size in pixels, 4:3. CSS scales the canvas to fit the window; the buffer stays fixed. */
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 768;

/** Cube colors, RGBA. Space cycles through them in this order. */
export const COLORS: readonly (readonly [number, number, number, number])[] = [
  [0, 1, 1, 1], // cyan
  [1, 0, 1, 1], // magenta
  [1, 1, 0, 1], // yellow
];

export const STRIDE_BYTES = 6 * 4; // 4 bytes per float (Float32)
export const NORMAL_OFFSET_BYTES = 3 * 4;
