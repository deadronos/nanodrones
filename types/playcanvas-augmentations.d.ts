/**
 * PlayCanvas runtime type augmentations for NanoDrones.
 *
 * Adds a few small, optional runtime-only properties to the `pc` namespace
 * so code can access them without excessive `as any` casts. Keep this file
 * minimal; extend if you encounter other runtime properties that need typing.
 */

declare global {
  namespace pc {
    interface StandardMaterial {
      /** Legacy/engine runtime property used by some materials */
      shininess?: number;
    }

    interface Scene {
      /** Runtime gamma correction value */
      gammaCorrection?: number;
      /** Runtime tone mapping enum/value */
      toneMapping?: number;
    }
  }
}

export {};
