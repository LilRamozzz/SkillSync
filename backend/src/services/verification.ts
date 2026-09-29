/**
 * Servicio de verificación institucional (prototipo).
 *
 * Estado actual: MOCK. Genera un código de 6 dígitos y lo devuelve al
 * frontend para simular el envío al correo institucional.
 *
 * Cómo integrar un servicio real después:
 *  1. Implementar `sendVerificationEmail(email, code)` con SendGrid / SES /
 *     el SMTP de la universidad.
 *  2. Dejar de exponer `verification_code` en la respuesta de /register.
 *  3. (Opcional) Validar el dominio contra una tabla `universities`
 *     o una API del ministerio/universidad.
 *
 * No se asume ninguna API universal de verificación: este módulo es el
 * único punto que habría que reemplazar.
 */
export function buildVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendVerificationEmail(_email: string, _code: string): Promise<void> {
  // MOCK: en el prototipo solo se registra en consola.
  console.log(`[verification mock] Código para ${_email}: ${_code}`);
}
