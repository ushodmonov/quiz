declare module 'wmf/dist/wmf.js' {
  export function image_size(data: Uint8Array): [number, number]
  export function draw_canvas(data: Uint8Array, canvas: HTMLCanvasElement): void
}
