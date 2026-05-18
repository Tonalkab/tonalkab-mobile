// src/utils/uvHelper.js

/**
 * Convierte el valor crudo del ADC de 12 bits (0-4095) del ESP32 al Índice UV estándar
 * junto con su categoría de riesgo y color sugerido para la interfaz.
 * * @param {number|string} nivelLuz - Valor crudo devuelto por los sensores del hardware.
 * @returns {object} Objeto con el valor del índice, la categoría de riesgo y el color hex.
 */
export function obtenerInfoUV(nivelLuz) {
  // Validación de seguridad en caso de que el valor llegue nulo o indefinido
  if (nivelLuz === null || nivelLuz === undefined) {
    return { valor: "0.0", categoria: "Sin Datos", color: "#64748B" };
  }

  // Forzar que sea un número entero y acotarlo al rango del ADC de 12 bits
  const valorCrudo = Math.min(Math.max(parseInt(nivelLuz, 10), 0), 4095);

  // 1. Convertir el valor crudo a Voltaje real (Voltaje de referencia de 3.3V)
  const voltajeV = (valorCrudo / 4095.0) * 3.3;

  // 2. Convertir el voltaje al Índice UV multiplicándolo por 10.0
  const indiceUVNum = voltajeV * 10.0;
  
  // Redondeamos estrictamente a 1 decimal para la consistencia visual de la UI
  const indiceUV = parseFloat(indiceUVNum.toFixed(1));

  // 3. Clasificación según la escala estándar internacional solicitada
  let categoria = "Riesgo Bajo";
  let color = "#22C55E"; // Verde (Soft UI de tu paleta Tonalkab)

  if (indiceUV >= 3.0 && indiceUV <= 5.9) {
    categoria = "Riesgo Moderado";
    color = "#EAB308"; // Amarillo
  } else if (indiceUV >= 6.0 && indiceUV <= 7.9) {
    categoria = "Riesgo Alto";
    color = "#F97316"; // Naranja
  } else if (indiceUV >= 8.0 && indiceUV <= 10.9) {
    categoria = "Riesgo Muy Alto";
    color = "#EF4444"; // Rojo
  } else if (indiceUV >= 11.0) {
    categoria = "Riesgo Extremo";
    color = "#8B5CF6"; // Morado
  }

  return {
    valor: indiceUV.toFixed(1), // Retorna el string formateado (ej. "4.2")
    valorNum: indiceUV,         // Retorna el número flotante por si se ocupa en otra lógica
    categoria,
    color
  };
}