// bidi-js Wrapper to resolve ESM/CommonJS default export mismatch.
import * as bidiJsModule from 'bidi-js/dist/bidi.js';

let bidiFactory = bidiJsModule;
if (bidiJsModule && bidiJsModule.default) {
  bidiFactory = bidiJsModule.default;
}

if (typeof bidiFactory !== 'function' && typeof bidiJsModule === 'function') {
  bidiFactory = bidiJsModule;
}

export default bidiFactory;
