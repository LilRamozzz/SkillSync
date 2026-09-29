/**
 * Algoritmo de matching de SkillSync (sin IA, solo intersección de conjuntos).
 *
 * Dados dos estudiantes A y B:
 *   A→B = {conocimientos que A enseña} ∩ {conocimientos que B quiere aprender}
 *   B→A = {conocimientos que B enseña} ∩ {conocimientos que A quiere aprender}
 *
 *   compatibilidad = (|A→B| + |B→A|) / (|Aprende_A| + |Aprende_B|) × 100
 *
 * - 100% = cada uno quiere exactamente lo que el otro enseña (intercambio total).
 * - >0% unidireccional = hay ayuda posible en una sola dirección.
 * - 0% = sin coincidencia (no se muestra como match).
 *
 * IMPORTANTE: el porcentaje es una métrica técnica de coincidencia de
 * conocimientos. NO evalúa a la persona.
 */
export * from '../config/db';
