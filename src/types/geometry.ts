/**
 * A 2D coordinate expressed in **normalized map space** where both axes run
 * from 0 to 100. Keeping positions resolution-independent lets any renderer
 * (DOM, SVG, or a future WebGL/3D one) place a node without knowing the pixel
 * size of the viewport.
 */
export interface Vec2 {
  x: number;
  y: number;
}
