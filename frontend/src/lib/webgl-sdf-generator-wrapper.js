// WebGL SDF Generator Wrapper to resolve ESM/CommonJS default export mismatch.
import * as webglSdfGenerator from 'webgl-sdf-generator/dist/webgl-sdf-generator.js';

let createSDFGenerator = webglSdfGenerator;
if (webglSdfGenerator && webglSdfGenerator.default) {
  createSDFGenerator = webglSdfGenerator.default;
}

// If it's still wrapped, check if the function itself is exported
if (typeof createSDFGenerator !== 'function' && typeof webglSdfGenerator === 'function') {
  createSDFGenerator = webglSdfGenerator;
}

export default createSDFGenerator;
