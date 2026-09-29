// Prototipo: asesorías dadas y valoración promedio por usuario.
// Valores de DEMO para los 4 usuarios de prueba; el resto parte en 0.
// Reemplazar por consultas a las tablas de sesiones y valoraciones cuando existan.
const DEMO: Record<string, { given: number; rating: number }> = {
  'leonardo.ramos@utp.edu.pe': { given: 18, rating: 4.9 },
  'carlos.mendoza@unmsm.edu.pe': { given: 27, rating: 4.7 },
  'andrea.torres@pucp.edu.pe': { given: 34, rating: 4.8 },
  'miguel.quispe@upc.edu.pe': { given: 9, rating: 4.5 },
};

export function advisoryStats(email: string): { given: number; rating: number } {
  return DEMO[email.toLowerCase()] ?? { given: 0, rating: 0 };
}