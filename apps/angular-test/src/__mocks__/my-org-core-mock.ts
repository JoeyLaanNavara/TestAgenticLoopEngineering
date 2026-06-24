// Stub for @my-org/core used only in the Angular proxy's `declare interface` (type-only).
// This prevents Jest from loading Stencil component source (which uses its own JSX factory).
export namespace Components {}
export namespace JSX {
  export interface IntrinsicElements {}
}
