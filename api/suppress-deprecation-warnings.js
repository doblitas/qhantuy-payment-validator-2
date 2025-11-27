/**
 * SECURITY: Suprimir warnings de deprecación de url.parse() que vienen de dependencias externas
 * Este módulo debe importarse ANTES de cualquier otra dependencia que pueda usar url.parse()
 * 
 * NOTA: El warning DEP0169 viene de dependencias externas (@shopify/shopify-api, ioredis, etc.)
 * No podemos controlar directamente el uso de url.parse() en esas dependencias.
 * Este módulo intercepta y suprime el warning específico sin afectar otros warnings de seguridad.
 */

// Interceptar process.emitWarning ANTES de que se importen las dependencias
if (typeof process !== 'undefined') {
  // Guardar la función original
  const originalEmitWarning = process.emitWarning;
  
  // Reemplazar process.emitWarning con nuestra versión que filtra DEP0169
  process.emitWarning = function(warning, type, code, ...args) {
    // Suprimir específicamente el warning DEP0169 sobre url.parse()
    // Este warning viene de dependencias externas y no podemos controlarlo
    if (
      code === 'DEP0169' ||
      (typeof warning === 'string' && warning.includes('DEP0169') && warning.includes('url.parse()'))
    ) {
      // Suprimir este warning específico ya que viene de dependencias externas
      // y no podemos controlarlo directamente
      return;
    }
    
    // Permitir que otros warnings pasen normalmente (incluyendo otros warnings de seguridad)
    return originalEmitWarning.call(process, warning, type, code, ...args);
  };
  
  // También interceptar stderr.write para capturar warnings que se escriben directamente
  if (process.stderr && process.stderr.write) {
    const originalStderrWrite = process.stderr.write;
    process.stderr.write = function(chunk, encoding, callback) {
      if (typeof chunk === 'string' && chunk.includes('DEP0169') && chunk.includes('url.parse()')) {
        // Suprimir este warning específico
        return true; // Indica que se escribió exitosamente (pero en realidad lo suprimimos)
      }
      return originalStderrWrite.call(process.stderr, chunk, encoding, callback);
    };
  }
}

// También interceptar console.warn para capturar warnings que se emiten directamente
if (typeof console !== 'undefined' && console.warn) {
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.map(arg => typeof arg === 'string' ? arg : String(arg)).join(' ');
    if (message.includes('DEP0169') && message.includes('url.parse()')) {
      // Suprimir este warning específico
      return;
    }
    return originalWarn.apply(console, args);
  };
}

